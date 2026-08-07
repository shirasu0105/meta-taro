# 04_api.md

# API Design

## 1. 方針

MVPでは**外部公開APIを持たない**。全データはビルド時に静的JSONから読み込み、ページに焼き込む。
「API」に相当するのは以下の3層。

1. `lib/` のデータアクセス関数（サーバー内部）
2. SEO用メタデータファイル（sitemap / robots）
3. 外部CDN（Data Dragon）のURL規約

## 2. データアクセス層（`lib/`）

すべて同期関数（静的JSONの読み込みのみ）。型は [03_database.md](./03_database.md) §3 を使用。

| 関数 | シグネチャ | 用途 |
|---|---|---|
| `getMeta` | `() => Meta` | パッチ番号・更新日の表示 |
| `getChampions` | `() => Champion[]` | 検索UIへ渡すマスタ（クライアントにも配布可） |
| `searchChampions` | `(query: string, lane?: string) => Champion[]` | ひらがな・カタカナ・英語の部分一致検索（クライアント側でも使用） |
| `getLaneMatchup` | `(lane: Lane, me: string, enemy: string) => LaneMatchup \| null` | 対面結果。`null` = データなし |
| `listLaneMatchups` | `() => { lane: Lane; me: string; enemy: string }[]` | `generateStaticParams` / sitemap 用 |
| `getGlossary` | `() => GlossaryEntry[]` | 用語集 |

- slugのパース（`ahri-vs-annie` → `{ me, enemy }`）とその逆変換も `lib/` に置く（URL規約は 02_architecture §6）
- 検索履歴の読み書き（localStorage・直近10件）はクライアント用ユーティリティとして `lib/` に置く

> **`getBotMatchup` / `listBotMatchups` は T-1300 で削除した**（BOTがスコープ外のため）。
> `listLaneMatchups` は `readdirSync` で `data/matchups/{lane}/` を走査するため、
> **空の `jg/` ディレクトリを消してはならない**（03_database §2）。

## 3. SEO用ファイル

Next.js のメタデータファイル規約を使用（`node_modules/next/dist/docs/` の metadata 章参照）。

| ファイル | 内容 |
|---|---|
| `app/sitemap.ts` | LP・検索・用語集・法務3ページ + `listLaneMatchups` の全対面ページ |
| `app/robots.ts` | 全許可 + sitemap参照 |
| 各対面ページ `generateMetadata` | タイトル（例「アーリ vs アニー MID対面攻略」）・description・OG。データなし時は `robots: { index: false }` |
| 対面ページ JSON-LD | 構造化データ（Article相当）を埋め込む |

## 4. 外部API（Data Dragon）

画像のみ利用。バージョンは `meta.json` とは独立に定数管理（例 `14.24.1`）。

| 種類 | URL形式 |
|---|---|
| チャンピオンアイコン | `https://ddragon.leagueoflegends.com/cdn/{ver}/img/champion/{ddragonId}.png` |
| スキルアイコン | `https://ddragon.leagueoflegends.com/cdn/{ver}/img/spell/{icon}` |
| サモナースペル | `https://ddragon.leagueoflegends.com/cdn/{ver}/img/spell/{spell}.png` |
| アイテム | `https://ddragon.leagueoflegends.com/cdn/{ver}/img/item/{itemId}.png` |
| ルーン | `https://ddragon.leagueoflegends.com/cdn/img/{runeIconPath}` |
| スプラッシュ | `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{ddragonId}_0.jpg` |

- URL組み立てはヘルパー関数（`lib/ddragon.ts`）に集約する
- `next.config.ts` の `images.remotePatterns` に `ddragon.leagueoflegends.com` を登録

## 5. 将来拡張

### フィードバック送信（P15・T-1503）

**MVPの「外部公開APIを持たない」方針を破る唯一の経路。** 詳細設計は T-1501。

| 項目 | 方針 |
|---|---|
| 形式 | POST の Route Handler（`app/api/feedback/route.ts` 想定） |
| 呼び出し元 | 結果ページのフィードバックUI（クライアント） |
| 保存先 | 無料枠のマネージドDB（選定は T-1501） |
| 個人情報 | **取得しない**（識別子・IPの保存方針は T-1501 / T-1502 で確定） |
| 注意 | Cache Components 下では **GET** の Route Handler がプリレンダー対象になる。POST は対象外だが、`dynamic` 指定の要否は実装時に `node_modules/next/dist/docs/` で確認すること |

ページ配信は静的のまま。**閲覧時にこのAPIを叩かない**（02_architecture §4）。

### その他

- **リアルタイムAI**: Route Handler + LLM呼び出しを想定（PRD §7）
- **Riotログイン / プレイヤー連携**: RSO(OAuth)導入時に認証層を追加
- **統計取得**: Riot API（Match-V5）の自前集計を採る場合、収集は実行時ではなく `scripts/` のバッチで行い、結果を `data/` に焼き込む（T-1304）
- **BOT対面**: `getBotMatchup` / `listBotMatchups` を復元する（09 §9 の復活チェックリスト）
- リアルタイムAI・Riotログインは初版対象外（PRD §9）
