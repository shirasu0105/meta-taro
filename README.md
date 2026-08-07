# Metaたろう

League of Legends の初心者〜中級者が、チャンピオン選択〜ロード画面の短時間で対面知識を得られるAIアドバイスサービス。

本番: <https://meta.tar00.com>

- 対象: 日本サーバー / ゴールド〜プラチナ / ノーマルドラフト
- 提供: AI有利不利（星5段階）・立ち回り・注意スキル・パワースパイク・推奨ルーン/スペル/ビルド
- 検索: **TOP / MID**（JG / ADC / SUP は準備中）

## アーキテクチャ概要

- **Next.js 16（App Router / Cache Components）+ TypeScript + Tailwind CSS v4**
- データベースなし。事前生成データ（AIアドバイス）を `data/` の静的JSONとしてGit管理し、全ページをビルド時にプリレンダー（SSG）
- データ生成は `scripts/`（Python・ローカル手動実行）。パッチごとの更新はPRフローで反映（Vercel Preview → レビュー → マージ）
- ホスティング: Vercel / ドメイン取得・DNS: Cloudflare（一元管理）
- 画像: Riot Data Dragon CDN

詳細は [docs/02_architecture.md](./docs/02_architecture.md) を参照。

## ロードマップ

P1〜P8（MVP構築〜本番公開）は完了。以降の実施順は [docs/05_tasks.md](./docs/05_tasks.md) の「実施順」節が正。

| フェーズ | 内容 |
|---|---|
| **P13** | 要素技術開発 — 生成品質の評価指標・真値の定義、モデル選定、RAG等の技術選定 |
| **P14** | UI/UX改善・ブランディング — 検索UI統合、結果ページの導線再設計、ロゴ刷新 |
| **P15** | フィードバック自律成長機構 — 収集したフィードバックを次回生成へ還流 |
| P9残 / P11 / P12 | AdSense・GA4（凍結中）/ カバレッジ拡大 / 広告表示 |

## セットアップ

```bash
npm install
npm run dev   # http://localhost:3000
```

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/00_PRD.md](./docs/00_PRD.md) | プロダクト要求 |
| [docs/01_requirements.md](./docs/01_requirements.md) | 機能要件 |
| [docs/02_architecture.md](./docs/02_architecture.md) | アーキテクチャ |
| [docs/03_database.md](./docs/03_database.md) | データ設計（静的JSON） |
| [docs/04_api.md](./docs/04_api.md) | API・データアクセス設計 |
| [docs/05_tasks.md](./docs/05_tasks.md) | 実装タスク・フェーズ実施順 |
| [docs/06_ui.md](./docs/06_ui.md) | UI仕様（プロトタイプ準拠） |
| [docs/07_release.md](./docs/07_release.md) | リリース・デプロイ |
| [docs/08_testing.md](./docs/08_testing.md) | テスト・Playwright MCP評価 |
| [docs/09_data_pipeline.md](./docs/09_data_pipeline.md) | データ生成パイプライン設計・運用手順 |
| [docs/10_operations.md](./docs/10_operations.md) | 運用・コスト管理 |

開発ルールは [CLAUDE.md](./CLAUDE.md)、UIプロトタイプは `docs/design/` にある。

## 免責

本サービスは Riot Games 公式ではありません。AI・統計情報は参考情報であり、勝利を保証するものではありません。
