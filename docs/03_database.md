# 03_database.md

# Data Design（静的JSON）

## 1. 方針

DBは使用しない。事前生成データ（統計 + AIアドバイス）は `data/` 配下の静的JSONとしてGit管理する。

理由:
- 初版は事前生成のみ（PRD §6）でランタイム書き込みが不要
- 週次更新のPRフロー・人手レビュー・ロールバック（01_requirements §9-10）とGit管理が直結する
- DB運用コストゼロ（ビジネス目標: 累積赤字5万円以内）

## 2. ディレクトリ構成

```
data/
  meta.json                 パッチ番号・更新日
  champions.json            チャンピオンマスタ
  glossary.json             用語集
  matchups/
    top/{me}-vs-{enemy}.json
    mid/{me}-vs-{enemy}.json
    jg/                     空（未対応。ディレクトリのみ残す）
    bot/                    空（スコープ外。ディレクトリのみ残す）
```

- ファイル名のslugはURL設計（02_architecture §6）と同一: Data Dragon 英語IDの小文字
- 自分視点で1ファイル。逆視点（`annie-vs-ahri`）は別ファイル

> **`jg/` `bot/` は空でもディレクトリを削除しないこと**（T-1300）。
> `lib/data.ts` の `listLaneMatchups()` / `listBotMatchups()` が `readdirSync` で走査しており、
> **ディレクトリが存在しないと例外を投げてビルドが落ちる**。
> 退避したJSONは `docs/archive/bot/data/` にある。

## 3. スキーマ

TypeScript型で定義する（実装時は `lib/types.ts` に置く）。

```ts
type Lane = "top" | "jg" | "mid";

type Meta = {
  patch: string;      // 例 "26.13"
  updatedAt: string;  // 例 "2026-07-13"
};

type Champion = {
  id: string;                       // slug（例 "ahri", "leesin"）
  ddragonId: string;                // Data Dragon表記（例 "Ahri", "LeeSin"）画像URL用
  name: { ja: string; en: string }; // 例 { ja: "アーリ", en: "Ahri" }
  search: string[];                 // 検索語: ひらがな・カタカナ・英語（例 ["あーり", "アーリ", "ahri"]）
  lanes: ("top" | "jg" | "mid" | "adc" | "sup")[]; // 適性レーン
};

type DangerSkill = {
  slot: "P" | "Q" | "W" | "E" | "R";
  name: string;        // 例 "ディスインテグレート"
  tag: string;         // 例 "スタン起点" / "範囲" / "要警戒"
  description: string;
  icon: string;        // Data Dragon spell画像ファイル名（例 "AnnieQ.png"）
};

type SpikeMark = "◎" | "○" | "△";
type PowerSpike = {
  me:    { early: SpikeMark; mid: SpikeMark; late: SpikeMark };
  enemy: { early: SpikeMark; mid: SpikeMark; late: SpikeMark };
  note: string;        // 例 "15分までは耐える時間。2コア完成が反撃の合図"
};

type Item = { id: number; name: string };  // idはData Dragonアイテム番号（例 6672）

type Recommended = {
  runes: { keystone: string; primary: string; secondary: string; icon: string };
  spells: string[];    // 例 ["SummonerFlash", "SummonerHeal"]（Data Dragon表記）
  build: {
    core: Item[];          // コア3品
    boots: Item;
    situational: { item: Item; reason: string }[];
  };
};

type LaneMatchup = {
  lane: Lane;
  me: string;              // champion id
  enemy: string;
  aiRating: 1 | 2 | 3 | 4 | 5;   // AI総合評価（星5段階で表示）
  advantage: string;             // 表示ラベル: "有利" | "五分" | "不利"
  winRate?: number;              // me視点の統計勝率（例 52.4）。統計ソース未整備のため
                                 // Phase 1 では生成も表示もしない（09_data_pipeline §2）
  summary: string;               // 30秒要約
  gamePlan: { early: string; mid: string; late: string };  // 詳細立ち回り（序盤・中盤・終盤）
  dangerSkills: DangerSkill[];
  powerSpike: PowerSpike;
  recommended: Recommended;
  glossaryRefs: string[];        // 用語集slug
};

type GlossaryEntry = {
  slug: string;        // 例 "all-in"
  term: string;        // 例 "オールイン"
  description: string;
};
```

> **`LaneMatchup` の項目は P13 の T-1301 で見直す。** 表示項目の増減がそのままスキーマに反映される（T-1404）。
> 変更時は `lib/types.ts` と pydantic モデルの両方を更新し、`check-drift` を通すこと（09 §4.1）。

### 3.1 アーカイブ: BOTのスキーマ

BOT（2v2）は 2026-08-07 に当面のスコープ外とした（T-1300）。復活時に参照するための型定義を残す。

```ts
type BotViewAdvice = {           // ADC / SUP 視点別
  summary: string;               // gamePlan は持たない（視点別の立ち回りは summary に含める）
  dangerSkills: DangerSkill[];
  powerSpike: PowerSpike;
  recommended: Recommended;
  glossaryRefs: string[];
};

type BotMatchup = {
  myAdc: string; mySup: string;
  enemyAdc: string; enemySup: string;
  aiRating: 1 | 2 | 3 | 4 | 5;   // 4体の組み合わせ評価
  advantage: string;
  winRate?: number;              // ペア統計。上に同じく未使用
  views: { adc: BotViewAdvice; sup: BotViewAdvice };
};
```

### 3.2 フィードバック（P15 で確定）

収集項目・保存先・保持期間は **T-1501 で設計する**。本節はプレースホルダ。
静的JSONではなくマネージドDBに置く唯一のデータであり、`data/` には含めない（02_architecture §3）。

## 4. データなし判定

- 該当slugのJSONファイルが存在しない = 「データがありません」（FR-013）
- 表示はするがSEO対象外（`noindex`）。詳細は 02_architecture §4

## 5. バージョン管理

- `data/` の最新状態が常に本番反映対象
- 週次更新はPRでマージし、マージコミットにGitタグ `data/{patch}`（例 `data/26.13`）を付与
- タグは直近4パッチ分のみ保持（要件: 直近4バージョン保持）。古いタグは週次運用で削除
- ロールバックはタグ位置への `git revert`（[07_release.md](./07_release.md)）

## 6. モックデータ計画（MVP）

MVPで手作りしたモック8件 + P7 のパイプラインで生成した4件のうち、**TOP / MID の6件のみが現行データ**。
JG 3件・BOT 3件は T-1300 で `docs/archive/bot/data/` へ退避した。

| レーン | 対面 | 状態 |
|---|---|---|
| MID | `ahri-vs-annie` | 現行（プロトタイプ再現） |
| MID | `ahri-vs-zed` | 現行（P7生成） |
| MID | `orianna-vs-syndra` | 現行 |
| TOP | `garen-vs-darius` | 現行 |
| TOP | `darius-vs-garen` | 現行（P7生成） |
| TOP | `aatrox-vs-malphite` | 現行 |
| JG | `leesin-vs-vi` / `vi-vs-leesin` / `graves-vs-kayn` | **退避**（T-1300） |
| BOT | `jinx-thresh-vs-caitlyn-lulu` / `jinx-thresh-vs-ashe-leona` / `ezreal-lux-vs-ashe-leona` | **退避**（T-1300） |

- `champions.json` は上記登場チャンピオン + オートコンプリート検証用（アニビア等）の計15体程度
  （**P7 で全チャンピオン169体へ拡張済み**。`npm run data -- champions sync` が生成する。レーン適性は `scripts/champion_lanes.json` で管理）
- `glossary.json` はプロトタイプ登場用語（オールイン・ポーク・スケール・フリーズ・フック・エンゲージ・ピール・プッシュ・ローム・スタック等）約10語
- **データなし検証用**: `mid/yasuo-vs-zed` は意図的に作成しない（08_testing のチェックで使用）

## 7. 生成データの書式

MVP以降、`data/matchups/` はPhase 1パイプライン（[09_data_pipeline.md](./09_data_pipeline.md)）が生成する。
手作りモックとの書式差でdiffが荒れないよう、**全ファイルを以下に統一する**。

- `json.dump(indent=2, ensure_ascii=False)` 相当（配列内オブジェクトを1行に畳まない）
- Unicode NFC・末尾改行1つ
- 以後はパイプラインの出力書式を唯一の正とし、手編集した場合も同書式に揃える
