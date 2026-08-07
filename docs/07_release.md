# 07_release.md

# Release Design

## 1. インフラ構成

| 役割 | サービス | 備考 |
|---|---|---|
| アプリ配信（本番 / Preview） | Vercel | GitHubリポジトリ連携で自動デプロイ |
| ドメイン取得・DNS管理 | Cloudflare | 登録時に自動作成されるDNSゾーンでVercel指定のCNAME/Aレコードを管理（一元化。ネームサーバー変更は不要） |

### 初期セットアップ手順

1. GitHubリポジトリをVercelプロジェクトに接続（Production Branch = `main`）
2. **★ドメイン確定まで本番を検索エンジンに晒さない** — Vercel の Deployment Protection を Production にも有効化する（または `app/robots.ts` を一時的に noindex にする）
3. Cloudflareでドメイン取得（登録と同時にCloudflare DNSゾーンが自動作成される）
4. Cloudflare DNSゾーンでVercel指定のDNSレコード（CNAME）を登録
5. Vercelにカスタムドメインを追加し、SSL発行を確認
6. Vercel の Production 環境変数に `NEXT_PUBLIC_SITE_URL = https://{確定ドメイン}` を設定
7. 再デプロイし、canonical / og:url / sitemap / robots が新ドメインに揃うことを確認
8. Deployment Protection を解除
9. Google Search Console にサイト登録 + sitemap送信（[10_operations.md](./10_operations.md)）

> **実施記録（2026-07・T-805）**: 確定ドメインは **`meta.tar00.com`**（Cloudflareで取得・DNS一元化）。
> `NEXT_PUBLIC_SITE_URL = https://meta.tar00.com` を Production に設定済みで、sitemap / robots / canonical / og:url
> はすべて本番ドメインに追従済み。
> - 手順2の Deployment Protection は今回は使わず、DNS切替→環境変数設定→再デプロイを短時間で実施して仮URL露出を最小化した。
>   仮URL `meta-taro-*.vercel.app` はインデックス対象の200を返さない（redirect / 404）ことを確認済み。
> - 手順9の所有権確認は、**CNAME化されたサブドメイン（`meta.tar00.com`）ではCloudflare自動連携のDNS-TXT確認が失敗する**。
>   CNAMEと同一名のTXTは共存しづらいため。**apexドメイン（`tar00.com`）での確認**か**手動TXTレコード方式**を使うこと
>   （今回は手動TXT方式で確認）。DNSに依らない代替は URLプレフィックスプロパティ + HTMLタグ（`metadata.verification.google`）。

> **手順2が必須である理由**: `lib/seo.ts` の `siteUrl()` は `NEXT_PUBLIC_SITE_URL` 未設定時に
> `VERCEL_PROJECT_PRODUCTION_URL`（= `*.vercel.app`）へフォールバックし、`app/robots.ts` は全許可である。
> この状態で公開すると `*.vercel.app` のURLがcanonical付きでインデックスされ、
> 正規ドメインへ移す際に重複コンテンツ扱いになる。
> 逆にURLの切替点は `lib/seo.ts` の1関数に集約されているため、環境変数1つで全面追従する。

環境変数は `NEXT_PUBLIC_SITE_URL` のみ（外部API・DBなし）。

### CI

`.github/workflows/ci.yml` で PR ごとに `npm run lint` / `npm run build` を実行する。
`main` へのブランチ保護（PR必須 + CI必須）を併せて設定し、CLAUDE.md の「main直コミット禁止」をGitHub側でも担保する。

`data/` を変更するPRでは、ローカルで `npm run data -- validate --all` を実行してから出す
（[09_data_pipeline.md](./09_data_pipeline.md) §4.1。TypeScript側に実行時検証がないため）。

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

- [ ] [08_testing.md](./08_testing.md) の全画面チェック合格（§5 の手動確認を含む）
- [ ] フッターの免責表記（Riot非公式・参考情報）が全ページに表示される
- [ ] **法務3ページ（利用規約 / プライバシーポリシー / 免責事項）が実在し、フッターから遷移できる**
- [ ] sitemap / robots / noindex（データなしページ）が機能している
- [ ] `NEXT_PUBLIC_SITE_URL` が本番ドメインで、canonical / og:url が正しい
- [ ] 独自ドメインでSSLが有効
- [ ] Deployment Protection を解除済み

## 7. AdSense申請手順（T-903）

> **現在は凍結中**（[05_tasks.md](./05_tasks.md) の実施順を参照）。P14 完了後に解凍する。
> 本節は T-903 の参照先として定義する。

### 申請前の前提条件

審査は「コンテンツの独自性・分量」と「サイトとしての体裁」を見る。以下が揃ってから申請する。

- [ ] 法務3ページ（利用規約 / プライバシーポリシー / 免責事項）が実在しフッターから遷移できる（T-803 完了済み）
- [ ] 問い合わせ導線が存在する（T-907）
- [ ] 独自ドメインでSSL有効・Search Console 登録済み（T-805 完了済み）
- [ ] 対面ページの分量が十分にある（P11 のカバレッジ拡大。**現状 TOP/MID 6件では不足の可能性が高い**）
- [ ] LP文面が固有のもので、テンプレート的でない（T-1405）

### 手順

1. `NEXT_PUBLIC_ADSENSE_CLIENT` を Production 環境変数に設定し、サイト確認スニペットと `ads.txt` を配信（T-902）
2. AdSense管理画面でサイトを追加し、サイト所有権の確認方法（AdSenseコードスニペット）を選択
3. 本番で `<head>` にスニペットが出力されていることを確認してから審査を提出
4. **審査状況を毎日確認する**（数日〜数週間かかる。不合格でも理由が具体的に示されないことが多い）
5. 不合格時はコンテンツ量・独自性・ポリシー違反の3観点で見直し、期間を空けて再申請
6. 合格後、広告ユニットの配置は P12（T-1201）で実施する

### 注意

- 審査中も広告は表示されない。**T-902 の広告コンポーネント雛形は env 未設定時に何も描画しない**設計を守ること
- 生成方式（プロンプト・LLM）は対外発信で説明しない（PRD §6）。AdSense のサイト説明にも書かない
