@AGENTS.md

# Metaたろう 開発ルール

LoLの対面知識をチャンピオン選択〜ロード画面の短時間で得られるAIアドバイスサービス。

## ドキュメント参照

実装・変更の前に `docs/` の該当ドキュメントを読むこと。

- 企画・要件: `00_PRD.md` / `01_requirements.md`
- 設計: `02_architecture.md`（技術構成・URL） / `03_database.md`(データ) / `04_api.md` / `06_ui.md`（UI仕様）
- 実装・検証: `05_tasks.md`（タスクと完了条件） / `08_testing.md`（評価手順）
- 運用: `07_release.md` / `09_data_pipeline.md` / `10_operations.md`

UI実装は `docs/06_ui.md` と `docs/design/` のプロトタイプHTMLを正とする。

## Git運用（GitHub Flow）

- `main` が本番。**直接コミット禁止**
- `feature/xxx`（データ更新は `data/{patch}`）ブランチを切り、PR → Vercel Preview確認 → マージ
- コミットメッセージは日本語でよい

## コマンド

- `npm run dev` — 開発サーバー
- `npm run build` — 本番ビルド（全SSGページ生成が通ること）
- `npm run lint` — ESLint

## 評価

UI・画面の変更後は Playwright MCP を使い `docs/08_testing.md` のチェックリストで確認する（390px / 1280px の両ビューポート）。
