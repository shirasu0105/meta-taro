# 05_tasks.md

# Implementation Tasks

## 1. 進め方

- フェーズ順に実装する。各フェーズ完了時に `npm run build` が通ること
- ブランチ・PR運用は CLAUDE.md（GitHub Flow）に従う
- UIは [06_ui.md](./06_ui.md) とプロトタイプを正とし、各画面完了時に [08_testing.md](./08_testing.md) の該当チェックを行う

## 2. タスク一覧

### P1: 基盤

| ID | タスク | 完了条件 |
|---|---|---|
| T-101 | `next.config.ts` 設定（`cacheComponents: true`、Data Dragon `remotePatterns`） | build成功 |
| T-102 | Tailwind `@theme` トークン定義 + `next/font`（Noto Sans JP / Cinzel） | 06_ui §2 の全トークンが使用可能 |
| T-103 | 型定義 `lib/types.ts`（03_database §3 のスキーマ） | 型チェック成功 |
| T-104 | モックデータ作成（`data/`: meta / champions / glossary / 対面8件） | 03_database §6 の全ファイルが存在しスキーマに適合 |
| T-105 | データアクセス層 `lib/`（04_api §2 の全関数 + slug変換 + `lib/ddragon.ts`） | 単体で全モックが読める |
| T-106 | 共通レイアウト（ヘッダー・フッター・パネル等の共通コンポーネント） | 06_ui §3 準拠 |

### P2: 画面

| ID | タスク | 完了条件 |
|---|---|---|
| T-201 | LP（`/`） | 06_ui §4.1 準拠・プロトタイプと視覚一致 |
| T-202 | 検索・通常レーンタブ（レーン選択・オートコンプリート・実行制御） | 06_ui §4.2 準拠。2体確定で結果へ遷移 |
| T-203 | 検索・BOTタブ（4体選択・進捗バー・実行制御） | 4体確定まで実行不可 |
| T-204 | 通常レーン結果ページ（SSG + `generateStaticParams`） | モック8件中6件が静的生成される |
| T-205 | BOT結果ページ（視点トグル含む） | ADC/SUP切替で内容が切り替わる |
| T-206 | 用語集ページ + アンカー遷移 | 結果画面の用語チップから遷移可能 |
| T-207 | データなし表示 | `mid/yasuo-vs-zed` で「データがありません」+ noindex |

### P3: SEO

| ID | タスク | 完了条件 |
|---|---|---|
| T-301 | `generateMetadata`（対面ページのtitle/description/OG） | 各対面ページに固有メタデータ |
| T-302 | `sitemap.ts` / `robots.ts` | 全対面ページがsitemapに含まれる |
| T-303 | JSON-LD 埋め込み | 対面ページに構造化データ出力 |

### P4: 検索履歴

| ID | タスク | 完了条件 |
|---|---|---|
| T-401 | localStorage履歴（保存・直近10件・重複整理） | 結果閲覧後、検索画面に履歴が出る |
| T-402 | 「最近の検索」「よく使う」表示 | 06_ui §4.2 準拠 |

### P5: 評価

| ID | タスク | 完了条件 |
|---|---|---|
| T-501 | `npm run lint` / `npm run build` 全通過 | エラーゼロ |
| T-502 | Playwright MCP による全画面評価 | 08_testing §4 チェックリスト全項目パス |
| T-503 | プロトタイプとの視覚照合（390px / 1280px） | 差分が意図的なもののみ |

## 3. スコープ外（実装しないこと）

Riotログイン・課金・広告・リアルタイムAI・多言語・オーバーレイ・試合中支援（PRD §9）。
週次データパイプライン（`scripts/`）は設計のみ（09_data_pipeline.md）で実装しない。
