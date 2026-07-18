# 07_release.md

# Release Design

## 1. インフラ構成

| 役割 | サービス | 備考 |
|---|---|---|
| アプリ配信（本番 / Preview） | Vercel | GitHubリポジトリ連携で自動デプロイ |
| ドメイン取得 | Cloudflare | |
| DNS管理 | Hostinger | ネームサーバーをHostingerに向け、VercelへのCNAME/Aレコードを設定 |

### 初期セットアップ手順（概要）

1. GitHubリポジトリをVercelプロジェクトに接続（Production Branch = `main`）
2. Cloudflareでドメイン取得
3. ドメインのネームサーバーをHostingerに設定し、Hostinger側でVercel指定のDNSレコード（A / CNAME）を登録
4. Vercelにカスタムドメインを追加し、SSL発行を確認

環境変数はMVPでは不要（外部API・DBなし）。

## 2. 環境

| 環境 | トリガー | 用途 |
|---|---|---|
| Production | `main` へのマージ | 本番公開 |
| Preview | PR作成・更新 | レビュー用（データ更新・UI変更の確認） |
| Local | `npm run dev` | 開発・Playwright MCP評価 |

## 3. リリースフロー（GitHub Flow）

```
feature/xxx ブランチ → PR → CI（lint / build）→ Vercel Preview確認 → レビュー承認 → main マージ → 本番反映
```

- `main` への直接コミット禁止
- Preview URLで [08_testing.md](./08_testing.md) の該当チェックを行ってからマージする

## 4. 週次データ更新リリース

[09_data_pipeline.md](./09_data_pipeline.md) のフローで生成された `data/` 更新PRも同じフローに乗せる。

1. データ更新PR（ブランチ名 `data/{patch}` 推奨）を作成
2. 自動検証（スキーマ等）+ Vercel Previewで表示確認
3. 人手レビュー・承認 → マージ → 本番反映
4. マージコミットにタグ `data/{patch}` を付与（直近4パッチ分保持、[03_database.md](./03_database.md) §5）

## 5. ロールバック

| 対象 | 手段 |
|---|---|
| アプリ不具合 | Vercelダッシュボードの Instant Rollback（直前デプロイに即時復帰） |
| データ不具合 | データ更新コミットを `git revert` するPR → マージで再デプロイ |
| 過去パッチへの復帰 | タグ `data/{patch}` の内容をチェックアウトして戻すPR |

## 6. 公開前チェックリスト

- [ ] [08_testing.md](./08_testing.md) の全画面チェック合格
- [ ] フッターの免責表記（Riot非公式・参考情報）が全ページに表示される
- [ ] sitemap / robots / noindex（データなしページ）が機能している
- [ ] 独自ドメインでSSLが有効
