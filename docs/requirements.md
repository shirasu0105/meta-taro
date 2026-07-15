# LoL AIアドバイスアプリ Metaたろう 要件定義書

# 1. プロジェクト概要

## 1.1 目的

League of Legends の初心者〜中級者（主対象: ゴールド〜プラチナ）が、
チャンピオン選択〜ロード画面の短時間で対面知識を得られるAIアドバイスサービスを提供する。

## 1.2 KPI

-   2027年1月までのいずれかの月で月間利益3万円
-   利益 = 広告 + 課金 − API料金
-   新規追加費用の累積赤字5万円以内

# 2. 開発方針

-   MVPを最優先
-   Web先行、iOSは後追い
-   APIコスト最小化
-   AIは初版すべて事前生成
-   週1更新
-   GitHub Flow

# 3. 技術スタック

  項目          採用
  ------------- ----------------------------
  Frontend      Next.js
  Database      Turso
  Hosting       Vercel
  Backup        Hostinger
  Container     Docker
  SCM           GitHub + SourceTree
  AI            Claude（将来リアルタイム）
  Static Data   Data Dragon
  Game Data     Riot API
  Payment       Stripe（将来）
  Ads           AdSense（承認後）

# 4. 画面一覧

1.  LP
2.  TOP/JG/MID検索
3.  ADC/SUP検索
4.  通常対面結果
5.  BOT対面結果
6.  データなし
7.  検索履歴
8.  用語集
9.  利用規約
10. プライバシーポリシー
11. 免責事項

# 5. 入力仕様

## 通常レーン

-   レーン
-   自チャンピオン
-   敵チャンピオン

## BOT

-   自ADC
-   自SUP
-   敵ADC
-   敵SUP

4体確定後のみ結果表示。

# 6. 出力仕様

## 必須表示

-   AI評価（5段階）
-   勝率
-   要約
-   詳細立ち回り
-   注意スキル
-   パワースパイク
-   推奨ルーン
-   推奨サモナースペル
-   推奨ビルド
-   用語リンク

## AI評価

AIは統計情報を入力として利用するが、有利不利はAIが総合判断する。
勝率は別項目として表示する。

# 7. BOT仕様

-   ADC視点ページ
-   SUPPORT視点ページ
-   4体一致で事前生成
-   データ不足時は「データがありません」

# 8. AI生成

## 初版

-   全件事前生成
-   リアルタイム生成なし

## 将来

-   個別チャット
-   敵別ビルド
-   敵別ルーン
-   プレイヤー履歴反映

# 9. データ更新

-   毎週
-   データ取得
-   差分抽出
-   AI生成
-   自動検証
-   Pull Request作成
-   人手レビュー
-   本番反映
-   ロールバック

直近4バージョン保持。

# 10. SEO

-   通常対面SEO
-   BOT対面SEO
-   データなしはnoindex

# 11. インフラ

## Vercel

-   Next.js
-   SEOページ
-   API
-   Preview

## Hostinger

-   バックアップ
-   メンテナンスページ
-   将来バッチ

# 12. セキュリティ

-   Secrets管理
-   SQL Injection対策
-   XSS対策
-   CSRF対策
-   レート制限
-   本番/開発DB分離

# 13. 非機能要件

-   スマホ優先
-   Safari/Chrome/Edge/Firefox
-   障害時は前回データ継続
-   キャッシュ利用
-   バックアップ

# 14. 管理運用

GitHub Pull Requestでレビュー。 Vercel Previewで表示確認。
承認後のみ公開。

# 15. 技術調査

-   統計データ取得方式
-   BOT統計取得
-   AIデータ構造
-   リアルタイムAI
-   APIコスト

# 16. MVP対象外

-   iOSネイティブ
-   Riotログイン
-   広告
-   課金
-   プレイヤー分析
-   リアルタイムAI
-   試合中支援
-   オーバーレイ
-   敵別ビルド
-   敵別ルーン
-   多言語

# 17. テスト方針

代表ケース確認 - 有利 - 不利 - 五分 - BOT - JG - データ不足

詳細なテスト実装方法は実装担当へ委譲。

# 18. リスク

-   統計データ取得方式未確定
-   Riot審査
-   広告審査
-   AI品質
-   BOT統計

# 19. 免責

-   Riot Games公式サービスではない
-   AI・統計は参考情報
-   勝利保証なし
-   パッチ・地域・更新日時を表示

# 20. Claude向け引継ぎ

## Claude Design

-   シンプルUI
-   LoL公式を参考
-   Data Dragon素材活用
-   モバイルファースト

## Claude Code

-   保守性重視
-   型安全
-   コンポーネント分割
-   GitHub Flow
-   CI/CD前提
-   設定値は環境変数管理
