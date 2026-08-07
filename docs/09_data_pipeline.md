# 09_data_pipeline.md

# Data Generation Pipeline Design

> **Phase 1（半自動生成）を実装対象とする。** ChatGPT Plus の web チャットに人手でプロンプトを貼り付け、
> 応答JSONをローカルのPythonスクリプトで検証・変換して `data/` に書き出す。
> 統計取得（§2）とAPI自動化（§6 Phase 2）は **P13（要素技術開発）で判断・実装する**。

> **2026-08-07 のスコープ変更**: 生成対象を **TOP / MID に限定**した（[05_tasks.md](./05_tasks.md) T-1300）。
> BOT（2v2）の生成は当面行わず、`bot_v1.md.j2` は T-905 の private マスタへ退避した。
> 本書の BOT に関する記述は **アーカイブ（§9）** に集約し、本文からは外している。復活の判断は T-1308。

本書は 01_requirements §9「データ更新」の詳細設計。実装タスクは [05_tasks.md](./05_tasks.md) P7（T-701〜T-711）と
P13（T-1300〜T-1309）。品質評価の設計は §8。

## 1. 全体フロー（Phase 1）

```
1. キュー選択    scripts/queue/matchups.csv から status=todo の対面を選ぶ
2. プロンプト生成 対面情報 + Data Dragon のチャンピオン事実を埋めた固定プロンプトを出力
3. 人手で生成    ChatGPT Plus の web チャットに貼り付け、```json 応答を得る
4. inbox保存     応答を generated/inbox/{lane}/{slug}.json に貼り付けて保存
5. 名前解決      日本語名 → Data Dragon の正規ID・画像ファイル名へ変換（§3）
6. 自動検証      スキーマ・参照整合・文字数・表記の機械チェック（§4）
7. 書き出し      data/matchups/{lane}/{slug}.json を生成し、キューCSVを更新
8. レビュー      レビューCSVをExcelで一覧確認（§7）
9. PR作成        data/{patch} ブランチでPR → Vercel Preview → マージ
```

8〜9は [07_release.md](./07_release.md) §4 のリリースフローに乗せる。

**差分抽出（前回データとの比較で更新対象を絞る）は Phase 2 以降。** Phase 1 はキューCSVの `priority` と `status` で人が対象を管理する。

## 2. 統計取得

> **Phase 1 では統計を使用しない。** `winRate` は生成させず、出力にも含めない。
> `aiRating`（有利不利）は統計を用いず、チャンピオンの構成・スキル相性にもとづくAIの判断として生成する。
> UI側も勝率を表示しない（[06_ui.md](./06_ui.md) §7 / [03_database.md](./03_database.md) §3 の `winRate?`）。

統計を持たないまま勝率を表示すると、AIが生成した数値を統計値として提示することになり、
ユーザーに対する誤表示になる。したがって統計ソースが確定するまで勝率機能そのものを止める。

Phase 2 で解決すべき取得方式（未決。01_requirements §12）。**調査タスクは T-1304、採否の決定は T-1308**:

| 候補 | 概要 | 論点 |
|---|---|---|
| Riot API から自前集計 | Match-V5 で対戦データを収集し対面勝率を集計 | 収集量・レート制限・集計基盤・開発者キー申請が必要 |
| サードパーティ統計の参照 | 既存統計サイトのデータ | 利用規約・ライセンス確認が必須 |

T-1304 の調査完了後に本節を確定させ、T-1308 で `winRate` 復活の可否を決定する。
統計を評価の**真値の一部**として使う案も §8 の検討対象に含める。

## 3. AI生成

### 3.1 使用するLLM

| フェーズ | LLM | 実行方法 |
|---|---|---|
| Phase 1 | **ChatGPT Plus**（web チャット） | 人手でプロンプトを貼り付け、応答をコピーして保存 |
| Phase 2 | API（**T-1306 で選定**。同一ゴールドセットでの採点 + 実測コストで比較） | Pythonから自動呼び出し |

**Phase 2 のモデル選定は T-1306**（Claude Sonnet 5 / Claude Opus 5 / OpenAI GPT を比較）。
API化そのものの go/no-go は **T-1308 の判断ゲート**で決める。検証は無料枠・定額枠の範囲で行う（PRD §3）。

Phase 1 で web チャットを**手動操作**するのは、月額固定で追加の従量課金が発生せず（PRD §3 の累積赤字5万円以内に収まる）、
少数の対面で生成品質とプロンプトを固める段階に適しているため。
**ChatGPTのUIを自動操作するツールは使用しない**（OpenAI利用規約が出力の自動抽出を禁じているため）。

### 3.2 設計原則: 識別子はLLMに書かせない

**LLMには人間可読な日本語の名前だけを出力させ、Data Dragon の識別子はすべてPythonが解決する。**

数値ID・画像ファイル名・英語キーはLLMが最も高い確率で幻覚する情報であり、
かつ誤っていても文章としては自然に見えるため人手レビューで見逃されやすい。

| 最終スキーマのフィールド | LLMに出力させるもの | Pythonの解決元 |
|---|---|---|
| `Item.id` / `Item.name` | 日本語のアイテム名のみ | `item.json`(ja_JP) の `name` → 数値IDキー。`name` も正式名で上書き |
| `dangerSkills[].icon` / `.name` | `champion`(日本語名) + `slot`(Q/W/E/R) | `championFull.json` の `spells[]` から導出。**Pはプロンプトで禁止**（`lib/ddragon.ts` の `spellIconUrl` が `/img/spell/` 固定でパッシブ画像を表示できないため。解決器自体はPも解決でき、混入時は warning になる） |
| `recommended.spells` | 日本語スペル名（例「フラッシュ」） | `summoner.json` の `name` → `id`（例 `SummonerFlash`） |
| `recommended.runes.icon` | **出力させない**（`keystone` 名のみ） | `runesReforged.json` を走査。最も長いパスであり幻覚しやすいため必ずPython側で解決 |
| `glossaryRefs` | `glossaryTerms`（日本語の用語） | `data/glossary.json` の `term` → `slug` |
| `winRate` / `lane` / `me` / `enemy` | **出力させない** | キューCSVの行から注入。混入は `extra="forbid"` で検出 |

#### 参照する Data Dragon エンドポイント

バージョンは `lib/ddragon.ts` の `DDRAGON_VERSION` を唯一の正とし、Pythonはこの定数を読み取って使う。
別バージョンで解決すると、画像が存在しないアイテムIDを書き込むことになる。

| 対象 | エンドポイント |
|---|---|
| チャンピオン全情報 | `/cdn/{ver}/data/ja_JP/championFull.json` |
| アイテム | `/cdn/{ver}/data/ja_JP/item.json` |
| サモナースペル | `/cdn/{ver}/data/ja_JP/summoner.json` |
| ルーン | `/cdn/{ver}/data/ja_JP/runesReforged.json` |
| 英語表示名（`champions sync` 専用） | `/cdn/{ver}/data/en_US/champion.json`（ja_JP に英語名が無いため。初回アクセス時に自動取得） |

#### 名前解決アルゴリズム

1. **完全一致**（NFKC正規化 + 空白・中黒・長音記号の異体を除去 + casefold）
2. **別名表** `scripts/aliases.json`（例「ラバドン」→「ラバドンデスキャップ」）。解決失敗のたびに1行追加して育てる
3. **曖昧一致** `difflib.get_close_matches(cutoff=0.92)`。候補が唯一のときのみ採用し、warning に記録してレビューCSVに出す
4. **失敗** → その対面全体を `invalid` とし、`data/` への**部分書き込みを行わない**

アイテム辞書は誤マッチ防止のため、構築時に `maps["11"]==true` / `gold.purchasable==true` / `requiredAlly` なし で絞り込む。
同一の正規化名が複数IDに衝突した場合は、黙って片方を選ばず辞書構築時点でエラーにする。

用語（`glossaryTerms`）は完全一致のみ。未収載の語が来た場合はその語を落として warning に記録する
（用語チップは装飾要素であり1語落ちても記事は成立する）。ただし解決後3語未満なら `invalid`。

### 3.3 プロンプト設計

テンプレートは `scripts/prompts/lane_v1.md.j2`（Jinja2）。P13 の T-1307 で v2 系に改訂する。

```
§0 役割と出力契約   日本語コーチとして書く / ```json フェンス1つのみ / スキーマ外キー禁止
§1 対面情報         レーン・自分・相手（キューCSVから注入）
§2 チャンピオン事実  ★幻覚の最大の防波堤
                    Data Dragon ja_JP の正式スキル名と効果要約を、敵味方それぞれP/Q/W/E/R分だけ注入する
§3 使用可能な語彙    クローズドリストで提示
                    用語（glossary.json の全語）/ サモナースペル / ルーンキーストーン / ルーンツリー
                    ※アイテムはリストを与えず「日本語の正式名称（略称・愛称を使わない）」と指示する
§4 出力スキーマ      JSON例 + 各フィールドの文字数を併記
§5 トーン・制約      ゴールド〜プラチナ帯の初心者〜中級者 / 平易な日本語 / 常体（です・ます禁止）
                    summary は「ロード画面の30秒で読める」量 / gamePlan は序盤・中盤・終盤の3分割を厳守
§6 禁止事項         勝率・パーセント・「◯%」を書かない（統計を持たないため）
                    断定表現（必ず・確実に・絶対に）を使わない
                    §2 にないスキル名・効果を書かない / §3 にない用語・スペル・ルーンを使わない
                    dangerSkills には相手のスキルのみを挙げる
§7 出力例           短縮版1件
```

#### 出力長・値の制約

現行のモックデータ8件の実測値から導出する。
**プロンプトとPython検証の両方に同じ数値を書く**（プロンプトに書くだけでは守られないため）。

| フィールド | 制約 |
|---|---|
| `summary` | 70–120字 |
| `gamePlan.early` / `.mid` / `.late` | 各50–90字 |
| `dangerSkills` | ちょうど3件（相手のQ/W/E/Rのみ。Pは不可） |
| `dangerSkills[].tag` | 2–8字 |
| `dangerSkills[].description` | 25–70字（当初28だったが実測min=25に合わせて改訂） |
| `powerSpike.note` | 25–70字 |
| `recommended.build.core` | ちょうど3件 |
| `recommended.spells` | ちょうど2件・重複なし |
| `situational` | 1–3件 / `reason` は3–15字 |
| `glossaryTerms` | 3–5語（解決後3語以上） |
| `aiRating` | 1〜5の整数 |
| `advantage` | `有利` / `五分` / `不利` のクローズドリスト |
| `SpikeMark` | `◎` / `○` / `△` のみ |

`aiRating` と `advantage` の整合（現行8件すべてを満たす写像。クロスフィールド検証で強制）:

| `aiRating` | `advantage` |
|---|---|
| 1, 2 | `不利` |
| 3 | `五分` |
| 4, 5 | `有利` |

> BOT対面のプロンプト設計は §9（アーカイブ）へ移した。

### 3.4 機密の取り扱い

**生成方式はユーザーへ公開しない**（PRD §6）。プロンプトと生成ロジックを公開リポジトリに置かないこと。

> **⚠ 現状の違反と是正（T-905）**: T-804 の対応でリポジトリを **PUBLIC 化**したため、
> `scripts/prompts/lane_v1.md.j2` / `bot_v1.md.j2` が公開状態にある。これは本節と PRD §6 に違反している。
> **T-905 でこれを是正する**（追跡から除外し、マスタを private 管理へ移行）。
> 本フェーズ（P13）はプロンプトへ本格投資するため、**T-905 完了が P13 の前提条件**である。

機密は `scripts/prompts/` と `scripts/metataro/prompt.py` の2箇所に閉じ込める。
public リポジトリ側にはこれらを置かず、private マスタ側に保管して手元でのみ結合する。

**private マスタの保管対象**（T-905 / T-1300）:

- `scripts/prompts/lane_v1.md.j2`（現行の生成プロンプト）
- `scripts/prompts/bot_v1.md.j2`（**T-1300 で退避。`docs/archive/` には置かない**。公開アーカイブに機密を戻すと T-905 の目的を打ち消すため）
- P13 の T-1307 で確定する v2 系プロンプト
- 表記ゆれ辞書 `scripts/aliases.json`（生成の癖が読み取れるため）

## 4. 自動検証

`data/` への書き出し前に機械チェックで足切りする。検証は **pydantic v2** で実装する
（日本語の文字数カウント・クロスフィールド検証・「LLM出力 → 解決 → 最終スキーマ」の2段構成が素直に書けるため）。

| 種別 | 内容 |
|---|---|
| **A. 構造** | 必須キー・型 / **未知キーの禁止**（`extra="forbid"`。`winRate` 混入をこれで自動検出）/ `aiRating` ∈ 1..5 の整数 / `SpikeMark` ∈ ◎○△ / `slot` ∈ P,Q,W,E,R / `lane` ∈ top,jg,mid / `advantage` の3値 / `aiRating` ↔ `advantage` の整合 |
| **B. 参照整合** | champion id が `champions.json` に実在 / レーン適性（`lane` ∈ `champion.lanes`）/ 同一チャンピオンの重複なし / `glossaryRefs` ⊆ `glossary.json` の slug・重複なし / `item.id` が `item.json` に実在 / `item.name` が正式名と一致 / `boots` が Boots タグを持つ / `dangerSkills[].icon` が該当スキルの画像と一致 / **`dangerSkills` が敵チャンピオンのスキルであること** / `spells` が `summoner.json` に実在 / `runes` の keystone・ツリーが実在し primary ≠ secondary |
| **C. 文字数・件数** | §3.3 の表をそのまま実装 |
| **D. 表記** | 常体違反（文末が「です」「ます」）を検出 / **統計混入の禁止**（「勝率」「ピック率」の語を検出。`%` 単体は「HP60%以下」のような本文表現として実在するため機械検出しない。プロンプト側の禁止事項は `%` 込みで厳しいまま）/ 断定表現NG（必ず・確実に・絶対に）/ 全角数字NG。**検査対象は `data/matchups/` のLLM文章フィールドのみ**（UI文言には意図的な打ち消し文があるため。P6評価レポート §2） |
| **E. ファイル** | 出力パスが `data/matchups/{lane}/{me}-vs-{enemy}.json` と自己整合 / slug が `lib/slug.ts` の規約を満たす / 既存ファイルの上書きは `--force` 必須 |
| **F. 正規化** | Unicode NFC / 前後空白除去 / `json.dump(indent=2, ensure_ascii=False)` + 末尾改行1つ。**改行コードは比較前にLFへ正規化する**（`core.autocrlf=true` のため作業ツリーは CRLF・index は LF。バイト比較をしてはならない。P6評価レポート §2） |

検証失敗した対面は `data/` に書き出さず `generated/rejected/` へ原文を退避し、キューCSVの `notes` に理由を記録する。

### 4.1 `lib/types.ts` との同期

TypeScript型（`lib/types.ts`）とpydanticモデルは二重定義になる。**コード生成はせず、ドリフト検出で守る。**

`check-drift` コマンドが `lib/types.ts` をパースしてフィールド名集合と optional フラグを抽出し、
pydanticモデルと突き合わせて差分があれば非ゼロ終了する。`ingest` / `validate` の先頭で自動実行する。
型の中身までは照合しない（現実的な破綻要因はフィールドの増減と optional 化のみ）。

> **実行時保証はTS側に存在しない**: `lib/data.ts` は `JSON.parse(...) as LaneMatchup` の無検査キャストであり、
> TypeScriptは `data/` の中身を一切保証していない。**Python検証器が唯一のガード**である。
> したがって新規ファイルだけでなく、`data/` を変更するPRでは毎回 `validate --all` で全件を検証する。

## 5. コスト管理

| フェーズ | コスト構造 |
|---|---|
| Phase 1 | ChatGPT Plus の月額固定のみ。従量課金なし |
| Phase 2 | `週次生成コスト ≒ 更新対面数 × (入力トークン + 出力トークン) × 単価` |

- Phase 2 では差分抽出（§1）で更新対面数を絞ることが最大のコストレバー
- 累積赤字5万円以内（PRD §3）を超えない範囲で対面カバレッジを段階拡大する
- 生成対象の優先順位: ピック率の高い対面から（キューCSVの `priority`）

## 6. 段階導入計画

| フェーズ | 統計 | 生成 | 品質評価 | 実行環境 | 状態 |
|---|---|---|---|---|---|
| **Phase 1** | なし（`winRate` 非表示） | ChatGPT Plus web + 人手貼り付け | 機械検証（§4）+ レビューCSV（§7.5） | ローカル手動Python | 実装済み |
| **Phase 1.5** | 〃 | 〃 | **ゴールドセット + 自動採点（§8）** | 〃 | **P13 の実装対象** |
| Phase 2 | §2 の方式を T-1304 / T-1308 で確定し導入 | API + 構造化出力（モデルは T-1306）。RAG採否は T-1303 | §8 の指標で回帰検証 | ローカル手動 or CI | T-1308 の判断次第 |
| Phase 3 | 〃 | フィードバック還流（P15 の T-1505） | 〃 | 〃 | P15 |
| Phase 4 | 〃 | リアルタイム生成 | 〃 | サーバー | 将来（PRD §7） |

**Phase 2 で差し替わるのは §1 手順3（人手でChatGPT）がAPI呼び出しになる1点のみ。**
名前解決・スキーマ・検証・レビューCSV・キューCSVはそのまま再利用される。
これが Phase 1 の実装が無駄にならない根拠であり、`prompt.py` の出力先だけを切り替えられる構成にしておく。

**Phase 1.5（品質評価基盤）を Phase 2 より先に置く理由**: モデルやプロンプトを差し替えても、
品質を測る物差しがなければ良くなったのか悪くなったのか判定できない。§8 を先に確立する。

## 7. 運用手順

### 7.1 ディレクトリ構成

```
scripts/                       commit（private運用前提）
  pyproject.toml / uv.lock     uv による依存管理（pydantic / httpx / jinja2 / pyperclip）
  README.md                    人間向け手順書
  aliases.json                 LLMの表記ゆれ → 正式名（運用しながら育てる）
  champion_lanes.json          チャンピオンのレーン適性 + 追加検索語（手作り。champions sync の入力）
  metataro/                    cli / config / ddragon / resolve / schema /
                               prompt / ingest / validate / review / queue / champions
  prompts/*.md.j2              ★機密。T-905 で追跡から除外し private マスタへ（§3.4）
  queue/matchups.csv           作業キュー兼監査ログ
  .cache/                      .gitignore（Data Dragon JSON 4ファイル + champion_en.json）
generated/                     .gitignore（ディレクトリごと）
  inbox/{lane}/{slug}.json     ChatGPT応答の貼り付け先
  rejected/{lane}/{slug}.json  検証NGの原文（原因調査用）
  review/review-{patch}.csv    レビュー用CSV
docs/archive/bot/              BOTのデータ・UIコード退避先（T-1300。プロンプトは含まない）
```

Python資産はすべて `scripts/` 配下に置き、リポジトリルートを汚さない。

### 7.2 作業キューCSV

`scripts/queue/matchups.csv`。`kind` 列で対面種別を区別し、Excelのフィルタで1シート運用する。

列: `id, kind, lane, me, enemy, my_adc, my_sup, enemy_adc, enemy_sup, slug, priority, status, prompt_version, generated_at, validated_at, published_patch, notes`

> **`kind=bot` は当面未使用**（T-1300 でBOTをスコープ外にしたため）。列そのものは復活時に備えて残す。
> 既存の bot 行は T-1300 で削除し、`docs/archive/bot/` に退避する。

| 列 | 意味 |
|---|---|
| `id` | 安定キー `{lane}/{slug}`。全コマンドの指定子 |
| `kind` | `lane` / `bot`（`bot` は当面未使用） |
| `priority` | 1(最優先)〜5。ピック率順 |
| `prompt_version` | `lane_v1` 等。プロンプト改訂時の再生成対象を特定するために必須 |
| `notes` | 差し戻し理由・検証エラー要約 |

ステータス遷移:

```
todo ──prompt──▶ prompted ──(人がChatGPT→inbox保存)──▶ drafted
                                                          │ ingest
                                    ┌─────────────────────┤
                                    ▼                     ▼
                                invalid              valid ──(レビューOK・PRマージ)──▶ published
                                    │                     │
                                    └──修正して再ingest    └──(レビューNG)──▶ rejected ──▶ todo

skip: 生成対象外（意図的な未作成・対面が成立しない組合せ）
```

**Excel互換の実装要件**（これを守らないとCSVが壊れる、あるいはgit diffがノイズだらけになる）:

- 読み書きとも `encoding="utf-8-sig"`。日本語WindowsのExcelで開いても文字化けしない
- `open(..., newline="")` + `csv.DictWriter(..., lineterminator="\r\n")`。Excelで保存し直しても往復できる
- **行順・列順を絶対に変えない。** 既存行を読み、該当セルのみ更新し、元の順で書き戻す
- 一時ファイル → `os.replace` のアトミック置換。Excelで開いたまま実行した場合は明示エラーにする

### 7.3 コマンド

`package.json` に `"data": "uv run --project scripts metataro"` を追加し、npm から統一的に呼ぶ。

```bash
npm run data -- prompt mid/ahri-vs-annie      # プロンプトをクリップボードへ（--stdout で標準出力）
npm run data -- ingest mid/ahri-vs-annie      # inbox → 解決 → 検証 → data/（上書きは --force）
npm run data -- ingest --scan                 # inbox の全ファイルを一括処理
npm run data -- validate --all                # data/ 全件を再検証（PR前に必須）
npm run data -- review --patch 26.13          # レビューCSV出力（--patch 省略時は meta.json の値）
npm run data -- queue add --kind lane --lane mid --me ahri --enemy annie --priority 1
npm run data -- queue list --status todo
npm run data -- queue set-status mid/ahri-vs-annie published --patch 26.13
npm run data -- ddragon sync                  # Data Dragon キャッシュ更新
npm run data -- champions sync                # data/champions.json を全チャンピオンで再生成
npm run data -- check-drift                   # lib/types.ts ↔ pydantic の整合
npm run data -- resolve --check-mocks         # 解決器の自己点検（既存全件の識別子を復元照合）
```

`champions sync` は `championFull.json`(ja_JP) の全チャンピオンに `scripts/champion_lanes.json` の
レーン適性を付与して `data/champions.json` を再生成する。**新チャンピオン追加時は
`champion_lanes.json` への追記が必須**（未収載だと sync がエラーで止まる）。

### 7.4 1対面あたりの手順

```
1. npm run data -- prompt mid/ahri-vs-annie   （プロンプトがクリップボードに入る）
2. ChatGPT Plus の web チャットに貼り付けて送信
3. 返ってきた ```json ブロックを generated/inbox/mid/ahri-vs-annie.json に保存
   （フェンスや前後の説明文が混ざったままでよい。ingest が除去する）
4. npm run data -- ingest mid/ahri-vs-annie
     OK → data/matchups/mid/ahri-vs-annie.json 生成、status=valid
     NG → エラー内容を表示し generated/rejected/ へ退避、status=invalid
5. npm run dev で該当ページを表示確認
6. まとまったら npm run data -- review → Excel で一覧レビュー
7. data/{patch} ブランチでPR → Vercel Preview → マージ → status=published
```

`ingest` は ```json フェンス付きのテキストをそのまま受け取れるようにする（人が余計な整形をせずに貼れるように）。
フェンス除去・前後の説明文除去は取り込み時の前処理で行う。

### 7.5 レビューCSV

`status ∈ {valid, published}` の対面を `data/` から読み直して出力する（inboxではなく確定データを見る）。
1対面1行。

| 見たいこと | 使う列 | Excelでの確認方法 |
|---|---|---|
| 日本語の不自然さ・内容の誤り | `summary`, `plan_*`, `danger_*` | 列幅を広げて流し読み |
| 長すぎ／短すぎ | `summary_len` | 条件付き書式（70未満・120超を赤） |
| 評価の一貫性 | `ai_rating`, `advantage` | ピボットで分布を確認。全部4なら評価が機能していない |
| ビルドの妥当性 | `keystone`, `core`, `boots` | 同一チャンピオンでソートし、対面ごとに変化しているか |
| **曖昧解決の混入** | `warnings` | 空でない行を抽出し**必ず目視** |
| スパイクの偏り | `spike_me`, `spike_enemy` | 全対面が同じパターンなら手抜き |

`warnings` はセミコロン区切りで積む（例: `resolved_by=fuzzy: "クラーケン・スレイヤー"→"クラーケンスレイヤー"; glossary未収載を除外: "ウェーブ管理"`）。

## 8. 品質評価（P13 で確定させる）

> **本節は現時点で未確定。** [05_tasks.md](./05_tasks.md) の **T-1302 が本節を埋めることを完了条件とする**。
> ここが空のまま T-1306（モデル比較）や T-1307（改善サイクル）に進むと、
> 「変えた結果よくなったのか」を判定できず、フェーズ全体が主観的な感想で終わる。

### 8.1 §4 の機械検証との違い

§4 の自動検証は **形式が守られているか**しか見ていない。スキーマ・文字数・参照整合が通っても、
「内容が対面のコーチとして役に立つか」は一切保証されない。本節はそこを測る。

| | §4 自動検証 | §8 品質評価 |
|---|---|---|
| 対象 | 形式・参照・表記 | 内容の有用性・正確性 |
| 判定 | 機械的に pass / fail | スコア（連続値）で比較 |
| 用途 | `data/` への足切り | モデル・プロンプトの優劣比較、回帰検出 |

### 8.2 T-1302 で決めること

1. **真値の定義** — 何を「正解」とするか。候補: ユーザーが手書きするゴールドセット / ルーブリック採点のみ（真値なし） / 統計データ（§2・T-1304）を真値の一部に使う。**この選択自体が T-1302 の調査対象**
2. **評価指標** — 事実正確性 / 具体性 / 網羅性 / 一貫性 などの軸と、各軸のスコアリング方法
3. **採点方法** — LLM-as-judge / 人手 / 併用。LLM-as-judge を使う場合は判定モデルと採点プロンプト
4. **ゴールドセットの規模と選定基準** — TOP / MID の代表対面を何件、どう選ぶか
5. **合格ライン** — この値を下回る生成物は `data/` に入れない、という閾値
6. **回帰検出の運用** — プロンプト改訂時に既存対面を再採点し、スコアが下がっていないことを確認する手順

### 8.3 実装（T-1305）

採点は `scripts/metataro/` にコマンドとして追加し、結果を CSV / Markdown で残す。
§7.5 のレビューCSVと同様に **Excelで開けること**、および
**同一入力で再実行したら同じ結果になること**（採点にLLMを使う場合は temperature とシード方針を固定）を要件とする。

## 9. アーカイブ: BOT（2v2）対面

> **2026-08-07 に当面のスコープ外とした**（T-1300）。データ・UIコードは `docs/archive/bot/`、
> プロンプトテンプレート `bot_v1.md.j2` は T-905 の private マスタに退避してある。
> 復活の判断は T-1308。以下は復活時に参照するための設計メモ。

### 9.1 プロンプト設計

4体分のスキル事実を注入し、`views.adc` / `views.sup` の視点別アドバイスを生成する。
`gamePlan` は `BotViewAdvice` に存在しないため出力させない。

**ADC視点とSUP視点は2回に分けて生成する**（`prompt bot/{slug} --view adc`）。
1リクエストの出力が長くなるほど後半の制約遵守率が落ちるため。

T-711 のチューニングで、`powerSpike` が視点間で不一致になる問題が出たため、
`bot_v1` に「ペア全体の評価として視点間で一貫させる」指示を追加している（P7 の申し送り）。

### 9.2 運用手順の差分

- 手順1〜3を視点ごとに2回行う（`--view adc` → `{slug}.adc.json`、`--view sup` → `{slug}.sup.json`）
- `ingest bot/{slug}` は両ファイルが揃ってから1回でよい（片方だけでは取り込まない）
- ペア全体の `aiRating` / `advantage` は ADC視点の出力から取る
- レビューCSVは**視点（adc/sup）ごとに1行**にする（列構成を通常レーンと揃え、`ai_rating` のピボットが視点をまたいで機能するため）

### 9.3 復活時のチェックリスト

- [ ] `docs/archive/bot/` から UIコードとデータJSONを戻す（`docs/archive/README.md` の手順）
- [ ] private マスタから `bot_v1.md.j2` を戻す
- [ ] **プロンプトは lane 側の v2 に合わせて作り直す**（アーカイブ版は v1 系で、P13 の改訂を反映していない）
- [ ] pydantic の Bot モデル・queueCSV の bot 行・`sitemap.ts` のBOT節を復元
- [ ] §8 のゴールドセットに BOT 対面を追加する（BOTは4体の組合せで難度が異なるため、lane のスコアが流用できない）
