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

**依存関係**: P6 → P7（T-703 のスキーマは勝率撤去後の型を前提とする）。P8 は P6 / P7 と並行可能。
T-805 は T-803 完了後が望ましい（公開時に規約がない状態を避ける）。

## 3. スコープ外（実装しないこと）

Riotログイン・課金・広告・リアルタイムAI・多言語・オーバーレイ・試合中支援（PRD §9）。
統計取得（`winRate`）とAPIによる生成自動化は Phase 2 以降（[09_data_pipeline.md](./09_data_pipeline.md) §2・§6）。
データ生成パイプラインは Phase 1（半自動・ローカル手動実行）のみを P7 で実装し、GitHub Actions / n8n による自動実行は行わない。
