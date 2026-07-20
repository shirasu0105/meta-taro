# 02_architecture.md

# Architecture Design

## 1. 目的

本書は Metaたろうの技術アーキテクチャを定義する。
機能要件は [01_requirements.md](./01_requirements.md)、データ設計は [03_database.md](./03_database.md) を参照。

## 2. 技術スタック

| 領域 | 技術 | 備考 |
|---|---|---|
| フレームワーク | Next.js 16.2.10（App Router） | Cache Components 有効化 |
| UI | React 19.2 / TypeScript 5 | |
| スタイリング | Tailwind CSS v4 | `@theme` でデザイントークン定義（[06_ui.md](./06_ui.md)） |
| データ | リポジトリ内静的JSON | DBなし（[03_database.md](./03_database.md)） |
| ホスティング | Vercel | Production / Preview |
| ドメイン | Cloudflare（取得）+ Hostinger（DNS管理） | |

> **重要**: この Next.js は学習データと異なる破壊的変更を含む。実装前に必ず
> `node_modules/next/dist/docs/` の該当ガイドを読むこと（AGENTS.md 参照）。

## 3. 全体構成

```
[ユーザー]
   │  ドメイン: Cloudflareで取得 / DNS: Hostingerで管理
   ▼
[Vercel CDN] ──── 静的シェル（全ページビルド時プリレンダー）
   │
[Data Dragon CDN] ─ チャンピオン/スキル/アイテム/ルーン画像
```

- 実行時のDB・外部APIアクセスなし。データはビルドに焼き込む
- 週次データ更新 = `data/` を更新するPR → マージで再ビルド・再デプロイ（[07_release.md](./07_release.md)）

## 4. レンダリング戦略

`next.config.ts` で `cacheComponents: true` を有効化する（Next.js 16 の Cache Components / PPR モデル）。

| 対象 | 戦略 |
|---|---|
| LP・用語集 | 静的コンポーネントのみ。ビルド時に完全プリレンダー |
| 対面結果ページ | `generateStaticParams` でデータ存在分を列挙し、同期的なJSON読み込み（決定的処理）で完全プリレンダー |
| データなしページ | `generateStaticParams` 対象外パラメータはオンデマンドレンダリング。JSON不在 → 「データがありません」表示 + `noindex` |
| 検索ページ | 静的シェル + Client Component（オートコンプリート・BOT 4体選択・履歴表示） |
| 検索履歴 | localStorage のみ（直近10件、サーバー保存なし） |

- データ読み込みは同期I/O（`fs.readFileSync` / JSON import）で行い、静的シェルに自動的に含める
- 動的データ・`use cache` が必要になるのはリアルタイムAI導入時（将来）

## 5. ディレクトリ構成

```
app/                     ルーティング（Server Components 基本）
  page.tsx               LP
  search/                検索（Client Component 中心）
  matchups/
    [lane]/[matchup]/    通常レーン結果（lane: top | jg | mid）
    bot/[matchup]/       BOT結果（静的セグメント bot が [lane] より優先される）
  glossary/              用語集
  legal/                 利用規約 / プライバシーポリシー / 免責事項
  sitemap.ts robots.ts   SEO（ファイル規約）
lib/                     データアクセス・ドメインロジック（04_api.md）
data/                    事前生成静的JSON（03_database.md）
scripts/                 データ生成パイプライン Phase 1（Python + uv・ローカル手動実行、09_data_pipeline.md）
  metataro/              CLI本体（prompt / ingest / validate / queue / review / ddragon / champions）
  prompts/               プロンプトテンプレート（★機密。09 §3.4）
  queue/matchups.csv     作業キュー兼監査ログ（Excel互換CSV）
generated/               gitignore（ChatGPT応答のinbox・検証NG退避・レビューCSV）
docs/                    本ドキュメント群・UIプロトタイプ
```

`npm run data -- <command>` で `scripts/` のCLIを呼ぶ（`uv run --project scripts metataro`）。

## 6. URL設計

| URL | 画面 | 例 |
|---|---|---|
| `/` | LP | |
| `/search` | 対面検索 | |
| `/matchups/{lane}/{me}-vs-{enemy}` | 通常レーン結果 | `/matchups/mid/ahri-vs-annie` |
| `/matchups/bot/{myAdc}-{mySup}-vs-{enAdc}-{enSup}` | BOT結果 | `/matchups/bot/jinx-thresh-vs-caitlyn-lulu` |
| `/glossary` | 用語集 | |
| `/legal/terms` | 利用規約 | |
| `/legal/privacy` | プライバシーポリシー | |
| `/legal/disclaimer` | 免責事項 | |

- チャンピオンslugは **Data Dragon 英語IDの小文字**（`Ahri`→`ahri`、`LeeSin`→`leesin`）
- 通常レーンは「自分視点」でURLが分かれる（`ahri-vs-annie` と `annie-vs-ahri` は別ページ）
- データなしURLは表示可能だが `noindex`（SEO対象外）

## 7. 外部依存

- **Data Dragon CDN**（`ddragon.leagueoflegends.com`）
  - アプリ実行時: 画像のみ利用。`next/image` の `remotePatterns` に登録
  - データ生成時（`scripts/`）: `ja_JP` のチャンピオン・アイテム・スペル・ルーンJSON（+ `champions.json` の英語表示名用に `en_US/champion.json`）を取得し、LLM出力の日本語名を正規IDへ解決する（09_data_pipeline.md §3.2）。バージョンは `lib/ddragon.ts` の `DDRAGON_VERSION` を唯一の正とする。チャンピオンのレーン適性は Data Dragon に存在しないため `scripts/champion_lanes.json` で手動管理する
- **Google Fonts**: Noto Sans JP / Cinzel。`next/font` で読み込み
- Riot公式APIはMVPでは未使用（統計取得方式は技術調査事項、[09_data_pipeline.md](./09_data_pipeline.md)）

## 8. 非機能方針

- **パフォーマンス**: 全ページ静的シェル配信。ランタイム処理ほぼゼロ
- **SEO**: Metadata API・sitemap・JSON-LD で対面ページを検索流入の入口にする（詳細は 04 / 08）
- **コスト**: Vercel無料枠内で開始。DBなしのため固定費ゼロ（[10_operations.md](./10_operations.md)）
- **可用性**: 静的配信のため障害点はVercelのみ。ロールバックは [07_release.md](./07_release.md)
