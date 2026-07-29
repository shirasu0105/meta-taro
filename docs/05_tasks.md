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

> P1〜P5 完了（PR #1〜#5、`main` にマージ済み）。評価結果は [reports/P5_evaluation.md](./reports/P5_evaluation.md)。

### P6: 勝率撤去とデータ整合

統計ソースが未確定のまま勝率を表示すると、AI生成値を統計値として提示することになるため、
`winRate` を任意項目化して非表示にする（[09_data_pipeline.md](./09_data_pipeline.md) §2）。
Phase 2 で手戻りなく復活できるよう、型と `WinRateBar.tsx` は残す。

| ID | タスク | 完了条件 |
|---|---|---|
| T-601 | `lib/types.ts` の `winRate` を任意化 + モック8件から `winRate` を削除 + 8件を `indent=2` へ書式正規化 | build成功。8件すべてに `winRate` キーが存在しない |
| T-602 | `EvaluationPanel.tsx` を条件分岐に改修（3列グリッド維持・右列を注記へ差し替え）。`WinRateBar.tsx` は温存し復活条件をコメント | 390px / 1280px で崩れず、パネル高が現状以下 |
| T-603 | 結果ページ2件の呼び出し更新（`winRateNote` 削除・新注記の適用） | 両ページに新注記が表示され、勝率が一切表示されない |
| T-604 | LPプレビューカードの勝率を `advantage` ラベルへ置換 + FEATURES 01 の文言更新 | LPに「勝率」の語が残っていない |
| T-605 | ドキュメント改訂（00 §5 / 01 §3,§5 / 03 §3 / 06 §2,§3,§4.1,§4.3,§4.4,§7 / 08 §4 / README） | 勝率の扱いが全ドキュメントで統一され、相互に矛盾しない |
| T-606 | Playwright MCP で 390px / 1280px 再評価 → `reports/P6_evaluation.md` | 更新後の 08_testing §4 チェックリストが全項目パス |

> P6 完了。評価結果は [reports/P6_evaluation.md](./reports/P6_evaluation.md)。
> T-605 は先行コミット（PR #6）で対応済みだったため検証のみ。あわせてデータなし文言から
> 「統計データ」を外した（06_ui §4.6）。**P7 着手前に P6 レポート §2 の申し送り（CRLF・書式・検査範囲）を読むこと。**

### P7: データ生成パイプライン Phase 1

[09_data_pipeline.md](./09_data_pipeline.md) の Phase 1（半自動生成）を実装する。Python はローカル手動実行のみ。

| ID | タスク | 完了条件 |
|---|---|---|
| T-701 | `scripts/` 骨格（`pyproject.toml` / uv / `.gitignore` 追記 / `package.json` に `data` スクリプト） | `npm run data -- --help` が動作 |
| T-702 | `ddragon.py`: `lib/ddragon.ts` からバージョン抽出 + 4ファイル取得・キャッシュ | `ddragon sync` で `.cache/` に4ファイルが揃う |
| T-703 | `schema.py`: LLM出力用・最終スキーマの pydantic モデル（`extra="forbid"`） | 現行モック8件が最終スキーマモデルで全件パス |
| T-704 | `resolve.py`: アイテム / スペル / スキル / ルーン / 用語 の5解決器 + `aliases.json` 初版 | モック8件の全識別子を人間可読名から復元でき、元の値と一致する |
| T-705 | `validate.py`（09 §4 の A〜F）+ `check-drift` | `validate --all` がモック8件でエラーゼロ。`winRate` を1件戻すとエラーになる |
| T-706 | `queue.py` + `queue/matchups.csv` 初版（既存8件 + 新規20件程度） | Excelで文字化けせず、`set-status` 後も行順・列順が保たれる |
| T-707 | `prompt.py` + `prompts/lane_v1.md.j2` / `bot_v1.md.j2` | プロンプトがクリップボードに入り、Data Dragon 由来のスキル事実が注入されている |
| T-708 | `ingest.py`（フェンス除去 → LLM検証 → 解決 → 最終検証 → 書き出し → CSV更新） | ChatGPTの実出力1件が正しいパスに生成され、`npm run dev` で表示できる |
| T-709 | `review.py`: レビューCSV出力 | Excelで開き、8件を1行ずつ確認できる |
| T-710 | `09_data_pipeline.md` を実装後の実手順に合わせて更新 + `02_architecture.md` の `scripts/` 記述更新 | ドキュメントだけを読んで第三者が1対面を生成できる |
| T-711 | 新規対面3件を実生成し、プロンプトを1周チューニング | 3件が検証を通過し、レビューCSVで品質が既存モック同等 |

> P7 完了。ChatGPT Plus 実出力から新規4対面（`mid/ahri-vs-zed` / `top/darius-vs-garen` / `jg/vi-vs-leesin` /
> `bot/jinx-thresh-vs-ashe-leona`）を生成し、`validate --all` 全12件パス・build 成功。
> **設計からの主な差分**（詳細は 09 の各節を改訂済み）:
> ① `description` 下限をモック実測に合わせ 28→25字 ② レビューCSVはBOTを視点ごとに1行
> ③ `champions.json` を全169体へ拡張（`champions sync` 追加。レーン適性は `scripts/champion_lanes.json` で手動管理）
> ④ モック8件のアイテム/スキル/ルーン名を Data Dragon 正式名へ上書き（旧表記は `aliases.json` に登録）
> ⑤ UI: `RecommendedPanels.tsx` の `SPELL_NAMES` に `SummonerBoost`(クレンズ) を追加（CLASSIC 9種を網羅。
> パイプラインはクローズドリストの全スペルを出力しうるため、この対応表の欠落は表示バグになる）。
> T-711 のチューニング: BOTの powerSpike が視点間で不一致になったため、`bot_v1` に
> 「ペア全体の評価として視点間で一貫させる」指示を追加（v1内改訂）。既存1件は人手レビューで整合修正。
> **新規4対面はマージ後に `queue set-status <id> published --patch 26.13` を実行すること。**

### P8: 品質・法務・公開

| ID | タスク | 完了条件 |
|---|---|---|
| T-801 | IME対応（`ChampionPicker.tsx`: composition state + `isComposing`/`keyCode 229` ガード + 変換中のドロップダウン抑止 + 候補件数表示） | 変換確定Enterで誤選択せず、IME候補ポップアップと重ならない |
| T-802 | `06_ui.md` §6 / `08_testing.md` にIME仕様と手動確認手順を追記 | 手動チェック項目が記載されている |
| T-803 | 法務3ページ（`app/legal/{terms,privacy,disclaimer}`）+ `SiteFooter` リンク差し替え + sitemap追加 | 3リンクが実ページへ遷移し、sitemapに含まれる（**要: 運営者情報・本文の確定**） |
| T-804 | `.github/workflows/ci.yml`（lint + build）+ PRテンプレート + `main` ブランチ保護 | PR作成でCIが走り、失敗するとマージできない |
| T-805 | Vercel接続・ドメイン取得・DNS・SSL（[07_release.md](./07_release.md) §1） | 独自ドメインでSSL有効。canonical / og:url / sitemap が本番ドメイン |
| T-806 | D-2: `MatchupHeader.tsx` のモバイル短縮表示 | 390pxで通常レーン・BOTともヘッダー行が折り返さない |
| T-807 | D-4: `BotSlot.tsx` の幅捻出（gap / アイコン / フォント） | 390pxで「スレッシュ」「ケイトリン」が省略されない |
| T-808 | Playwright依存を `devDependencies` へ移動 | `npm ci --omit=dev` で取得されない。build成功 |
| T-809 | F-4: `SearchSubmit.tsx` の注記を `note`（常時）/ `disabledNote`（未確定時のみ）に分離 | 通常レーンで2体確定後に注記が消える。BOTの注記は残る |

> **T-801 / T-802 / T-809 は P6 のPRで先行実施済み**（ユーザー要望による）。
> T-801 は `06_ui.md` §6.1 に**タッチ端末の例外**を追加した上で実装している（同§参照）。
> T-802 のドキュメントは P6 以前に整備済みだったため、今回は §6.1 の改訂と `08_testing.md` §4 への追記のみ。
> **T-806 / T-807 に着手する際の注意**: T-801 で `ChampionPicker` に「候補 N件」行を常時確保したため、
> BOTスロットの編集状態が約21px高くなっている。390pxのBOTスクリーンショットは T-807 実施時に撮り直すこと。

> T-803 / T-804 / T-806 / T-807 / T-808 完了（各PRで `main` にマージ済み）。**設計からの主な差分**:
> ① T-804: mainブランチ保護APIがprivateリポジトリ + GitHub Freeプランで403を返したため、
> リポジトリを**公開化**（事前にgit全履歴をシークレットパターンで監査しヒットなし）した上で
> `required_status_checks`（`lint-build`）+ `required_pull_request_reviews`（承認数0・PR必須）を適用。
> CIのNodeバージョンはローカル実測（v24.11.1）に合わせ `24` に固定。
> ② T-804着手時、既存の `package-lock.json` がCI環境（npm 11.16.0）で `npm ci` がEUSAGEエラーになる
> 不整合を含んでいたため、lockファイルを完全再生成して解消（T-808と無関係の既存潜在バグ）。
> ③ T-808: `playwright`/`@playwright/mcp` のdevDependencies化に加え、Tailwind v4 oxideのWASMバインディングが
> 要求する `@emnapi/core` / `@emnapi/wasi-threads` のバージョン衝突（`npm ci --omit=dev` がEUSAGEで失敗）を
> `package.json` の `overrides` で解消。
> ④ T-807: 実測で名前のtruncateが1px残っていたため、モバイルの `gap` をさらに1段階（`gap-1`）詰めて対応。
> ⑤ T-803: 運営者表記は「shirasu」（ハンドルネーム）、問い合わせ手段は当面記載なしでユーザー確認済み。
> 制定日は2026-07-20。`06_ui.md` §4.7 に法務ページの節を追加。

> T-805 完了。**P8 全タスク完了・本番公開済み**。独自ドメイン **`meta.tar00.com`**（Cloudflareで取得・DNSも
> Cloudflareに一元化）でSSL有効、`https://meta.tar00.com` が200配信。Production環境変数 `NEXT_PUBLIC_SITE_URL`
> 設定済みで、canonical / og:url / sitemap / robots がすべて本番ドメインに追従（`meta-taro-*.vercel.app` 仮URLは
> 露出なし）。Google Search Console 登録・サイトマップ送信済み。**設計からの差分**:
> ⑥ DNS管理を当初計画のHostingerからCloudflareへ一元化（PR #14。Vercel配信・外部DB/APIなしのためHostinger不要）。
> ⑦ Search Console のドメイン所有権確認は、Cloudflare自動連携が **CNAME化されたサブドメイン `meta.tar00.com` の
> DNS-TXT確認に失敗**したため、手動TXTレコード方式で確認した（CNAMEレコードとTXTは同一名で共存しづらいのが原因）。
> ⑧ 本番コスト前提を Vercel Pro（$20/月・利用クレジット$20同梱）に統一（別PR、`02_architecture` §8 / `10_operations` §2）。

**依存関係**: P6 → P7（T-703 のスキーマは勝率撤去後の型を前提とする）。P8 は P6 / P7 と並行可能。
T-805 は T-803 完了後が望ましい（公開時に規約がない状態を避ける）。

### P9: 検索UI統合・AdSense申請・運用ギャップ解消

P8完了後のインタビュー（2026-07-30）で確定した第三者展開に向けたフェーズ。
広告（AdSense）は審査待ち期間が長いため**申請だけ先行**し、審査中に検索UI改善と運用ギャップ解消を並行する。

| ID | タスク | 完了条件 |
|---|---|---|
| T-901 | 検索UI統合: タブ廃止・1ページ完結。レーン5択（TOP/JG/MID/ADC/SUP）、ADC/SUP選択時は検索欄4つ（自チームADC/SUP+敵ADC/SUP）、選択状況バー廃止。SUP選択時は結果URLに `?view=sup` を付与し `BotViewToggle` の初期視点に連動（URL導出型・Suspense必須） | 06_ui §4.2改訂版に準拠。build で全ルートが Static/PPR を維持。08_testing 改訂版チェックリスト全項目パス |
| T-902 | AdSense コード側準備: サイト確認スニペット（`NEXT_PUBLIC_ADSENSE_CLIENT`）・`ads.txt`・広告コンポーネント雛形（env未設定時は何も描画しない） | env未設定でも build/表示に影響ゼロ。env設定でヘッダに AdSense スニペットが出力される |
| T-903 | AdSense 申請（**ユーザー作業**）: サイト追加・審査提出・毎日の審査状況確認 | 申請手順書（07_release §6）に沿って申請完了 |
| T-904 | アクセス解析: GA4 導入（`NEXT_PUBLIC_GA_ID`、gtagスニペット。AdSenseと連携可能なためGA4を採用） | 本番でリアルタイムレポートに計測が載る |
| T-905 | プロンプト機密の対処: `scripts/prompts/*.j2`・`scripts/aliases.json` 等を追跡から除外し、マスタは private 管理へ移行。git履歴からの完全除去（filter-repo + force push）は影響が大きいためユーザー判断 | 公開リポジトリの HEAD に機密プロンプトが存在しない |
| T-906 | パッチ追随: `DDRAGON_VERSION` 更新 → `ddragon sync` / `champions sync` → `validate --all` → `data/meta.json` 更新 → `data/{patch}` PR | 最新パッチで検証パス。フッターのパッチ表記が最新 |
| T-907 | 問い合わせ導線: Googleフォームへの外部リンクをフッター・法務ページに追加（フォーム作成はユーザー） | 問い合わせリンクが機能する（AdSense審査対策） |

### P10: LLM品質比較・統計データソース調査（判断ゲート）

生成のAPI自動化と統計データの扱いを**判断するため**のフェーズ。実装より調査・比較が主体。

| ID | タスク | 完了条件 |
|---|---|---|
| T-1001 | LLM品質比較: 同一3〜5対面を Claude Sonnet 5 / Claude Opus 5 / OpenAI GPT で生成し、`validate` パス率・人手レビュー・実測コスト（count_tokens）で比較（概算: Sonnet 5 約2〜5円/対面、Opus 5 約8〜20円/対面・Batch API 50%割引時） | 比較レポートが reports/ にあり、モデル・コストの結論が出ている |
| T-1002 | 統計データソース調査: サードパーティ統計（OP.GG/U.GG/LoLalytics等）のAPI提供有無・利用規約を調査 → 不可なら Riot API（Match-V5）自前集計を設計（開発者キー申請含む） | 採用ソースと取得方法が 09_data_pipeline §2 に確定記載される |
| T-1003 | 判断ゲート: API化の go/no-go・ユースケース閾値の具体値（ピック率◯%等）・`winRate` 表示復活の可否を決定 | 決定内容が docs に反映され、P11 の対象対面リストの根拠になる |

### P11: カバレッジ拡大（TOP/MID 中心・手動生成）

| ID | タスク | 完了条件 |
|---|---|---|
| T-1101 | 統計に基づく優先対面リストで `scripts/queue/matchups.csv` を拡充（ピック率上位から） | キューに優先度付きで対象対面が登録されている |
| T-1102 | 手動生成の継続運用（当面の目標100対面）・週次 `data/{patch}` PR | published 対面数が目標に到達 |

### P12: 広告表示実装（AdSense審査通過後）

| ID | タスク | 完了条件 |
|---|---|---|
| T-1201 | 広告ユニット配置（結果ページ等・CLS対策・T-902の雛形をON化）・必要に応じ同意管理 | 本番で広告が表示され、Lighthouse CLS が悪化しない |
| T-1202 | 収益計測: AdSense/GA4連携・10_operations §2 の収支表運用に収益を反映 | 月次管理表に広告収入が記録できる |

**依存関係（P9以降）**: T-903 は T-902 完了後。P12 は T-903 の審査通過後。T-1101 は T-1002/T-1003 完了後。
T-901/T-904〜T-907 は互いに独立で並行可能。

## 3. スコープ外（実装しないこと）

Riotログイン・課金・リアルタイムAI・多言語・オーバーレイ・試合中支援（PRD §9）。
~~広告~~ → **広告は P9 で申請・P12 で表示実装に方針変更**（2026-07-30 インタビュー。PRD §3 の収益目標に基づく）。
統計取得（`winRate`）とAPIによる生成自動化は **P10 の判断ゲートで決定**（[09_data_pipeline.md](./09_data_pipeline.md) §2・§6）。
データ生成パイプラインの GitHub Actions / n8n による自動実行は引き続き行わない（API化する場合もローカル実行）。
