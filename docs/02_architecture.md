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
| ドメイン | Cloudflare（取得 + DNS管理） | 登録時に自動作成されるCloudflare DNSゾーンをそのまま使用 |

> **重要**: この Next.js は学習データと異なる破壊的変更を含む。実装前に必ず
> `node_modules/next/dist/docs/` の該当ガイドを読むこと（AGENTS.md 参照）。

## 3. 全体構成

```
[ユーザー]
   │  ドメイン: Cloudflareで取得・DNS管理（一元化）
   ▼
[Vercel CDN] ──── 静的シェル（全ページビルド時プリレンダー）
   │
[Data Dragon CDN] ─ チャンピオン/スキル/アイテム/ルーン画像
```

- 実行時のDB・外部APIアクセスなし。データはビルドに焼き込む
- 週次データ更新 = `data/` を更新するPR → マージで再ビルド・再デプロイ（[07_release.md](./07_release.md)）

> **P15 でこの原則を1点だけ改訂する。** ユーザーフィードバック収集（[05_tasks.md](./05_tasks.md) P15）のために、
> 送信用のサーバーレス関数（Route Handler）と無料枠のマネージドDBを追加する。
> **改訂はフィードバック送信の1経路に限る** — ページ配信は静的のままで、閲覧時にDBを引かない。
> 具体的な保存先・スキーマは T-1501 で確定する。

## 4. レンダリング戦略

`next.config.ts` で `cacheComponents: true` を有効化する（Next.js 16 の Cache Components / PPR モデル）。

| 対象 | 戦略 |
|---|---|
| LP・用語集 | 静的コンポーネントのみ。ビルド時に完全プリレンダー |
| 対面結果ページ | `generateStaticParams` でデータ存在分を列挙し、同期的なJSON読み込み（決定的処理）で完全プリレンダー |
| データなしページ | `generateStaticParams` 対象外パラメータはオンデマンドレンダリング。JSON不在 → 「データがありません」表示 + `noindex` |
| 検索ページ | 静的シェル + Client Component（オートコンプリート・履歴表示） |
| 検索履歴 | localStorage のみ（直近10件、サーバー保存なし） |
| フィードバック送信（P15） | Route Handler（唯一の動的経路）。ページ描画には関与しない |

- データ読み込みは同期I/O（`fs.readFileSync` / JSON import）で行い、静的シェルに自動的に含める
- 動的データ・`use cache` が必要になるのはリアルタイムAI導入時（将来）

## 5. ディレクトリ構成

```
app/                     ルーティング（Server Components 基本）
  page.tsx               LP
  search/                検索（Client Component 中心）
  matchups/
    [lane]/[matchup]/    対面結果（lane: top | mid。jg はデータ未提供）
  glossary/              用語集
  legal/                 利用規約 / プライバシーポリシー / 免責事項
  sitemap.ts robots.ts   SEO（ファイル規約）
lib/                     データアクセス・ドメインロジック（04_api.md）
data/                    事前生成静的JSON（03_database.md）
scripts/                 データ生成パイプライン Phase 1（Python + uv・ローカル手動実行、09_data_pipeline.md）
  metataro/              CLI本体（prompt / ingest / validate / queue / review / ddragon / champions）
  prompts/               プロンプトテンプレート（Jinja2。09 §3.3）
  queue/matchups.csv     作業キュー兼監査ログ（Excel互換CSV）
generated/               gitignore（ChatGPT応答のinbox・検証NG退避・レビューCSV）
docs/                    本ドキュメント群・UIプロトタイプ
  archive/bot/           スコープ外にしたBOTのデータ・UIコード（T-1300。プロンプトは含まない）
```

> **BOT（2v2）は 2026-08-07 に当面のスコープ外**（T-1300）。ルート `matchups/bot/` と BOT 専用
> コンポーネント・型は削除し、`docs/archive/bot/` に退避した。復活の判断は T-1308（09 §9）。
> **JG はデータのみ未提供**で、通常レーンと同じ `[lane]/[matchup]` テンプレートを共有するため
> コード上の差分はない（`data/matchups/jg/` は空ディレクトリとして残す — `readdirSync` が例外を投げるため）。

`npm run data -- <command>` で `scripts/` のCLIを呼ぶ（`uv run --project scripts metataro`）。

## 6. URL設計

| URL | 画面 | 例 |
|---|---|---|
| `/` | LP | |
| `/search` | 対面検索 | |
| `/matchups/{lane}/{me}-vs-{enemy}` | 対面結果 | `/matchups/mid/ahri-vs-annie` |
| `/glossary` | 用語集 | |
| `/legal/terms` | 利用規約 | |
| `/legal/privacy` | プライバシーポリシー | |
| `/legal/disclaimer` | 免責事項 | |

- チャンピオンslugは **Data Dragon 英語IDの小文字**（`Ahri`→`ahri`、`LeeSin`→`leesin`）
- 「自分視点」でURLが分かれる（`ahri-vs-annie` と `annie-vs-ahri` は別ページ）
- データなしURLは表示可能だが `noindex`（SEO対象外）
- BOT結果のURL `/matchups/bot/{myAdc}-{mySup}-vs-{enAdc}-{enSup}` は T-1300 で廃止（復活時は 09 §9 参照）

## 7. 外部依存

- **Data Dragon CDN**（`ddragon.leagueoflegends.com`）
  - アプリ実行時: 画像のみ利用。`next/image` の `remotePatterns` に登録
  - データ生成時（`scripts/`）: `ja_JP` のチャンピオン・アイテム・スペル・ルーンJSON（+ `champions.json` の英語表示名用に `en_US/champion.json`）を取得し、LLM出力の日本語名を正規IDへ解決する（09_data_pipeline.md §3.2）。バージョンは `lib/ddragon.ts` の `DDRAGON_VERSION` を唯一の正とする。チャンピオンのレーン適性は Data Dragon に存在しないため `scripts/champion_lanes.json` で手動管理する
- **Google Fonts**: Noto Sans JP / Cinzel。`next/font` で読み込み
- Riot公式APIはMVPでは未使用（統計取得方式は T-1304 の調査対象、[09_data_pipeline.md](./09_data_pipeline.md) §2）

### 将来追加される外部依存

いずれもフェーズ判断を経てから導入する。現時点では未使用。

| 依存 | 用途 | 導入フェーズ |
|---|---|---|
| LLM API（Claude / OpenAI 等） | 生成のAPI化。モデル選定は T-1306、go/no-go は T-1308 | P13 の判断次第 |
| マネージドDB（無料枠） | フィードバックの保存。選定は T-1501 | P15 |
| Riot API（Match-V5） | 統計の自前集計。T-1304 で設計 | T-1308 の判断次第 |

## 8. 非機能方針

- **パフォーマンス**: 全ページ静的シェル配信。ランタイム処理ほぼゼロ（P15 のフィードバック送信を除く）
- **SEO**: Metadata API・sitemap・JSON-LD で対面ページを検索流入の入口にする（詳細は 04 / 08）
- **コスト**: Vercel Pro（$20/月・利用クレジット$20同梱）+ ドメイン更新費が固定費。DB・実行時APIなしのため従量分は軽微でクレジット内に収まる見込み（[10_operations.md](./10_operations.md)）
  - **P13 の検証は無料枠・定額枠の範囲で行う**。追加課金が必要になった時点で判断を仰ぐ（PRD §3 の累積赤字5万円以内）
  - **P15 のDBも無料枠を前提**に選定する（T-1501）
- **可用性**: 静的配信のため障害点はVercelのみ。ロールバックは [07_release.md](./07_release.md)
