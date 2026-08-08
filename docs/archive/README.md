# docs/archive

スコープ外にした機能の退避先。**ビルド対象外**であり、ここのファイルはアプリから参照されない。

> ビルド対象外は `tsconfig.json` の `exclude` と `eslint.config.mjs` の `globalIgnores` の
> **両方**に `docs/archive/**` を入れて担保している。片方だけ消すと型エラー / Lintエラーになる。

## bot/ — BOT（2v2）対面

2026-08-07 のインタビューで、TOP / MID にリソースを集中する方針となり当面のスコープ外にした
（[05_tasks.md](../05_tasks.md) の T-1300）。将来 BOT を実装する際の参考資料として保管する。
**JG のデータも同じ理由でここに置いている**（JGはコード上の差分がなくデータのみのため）。

### 保管している内容（2026-08-08 時点）

| パス | 内容 |
|---|---|
| `bot/data/bot/*.json` | BOT対面3件（`jinx-thresh-vs-caitlyn-lulu` / `jinx-thresh-vs-ashe-leona` / `ezreal-lux-vs-ashe-leona`） |
| `bot/data/jg/*.json` | JG対面3件（`leesin-vs-vi` / `vi-vs-leesin` / `graves-vs-kayn`） |
| `bot/ui/app/matchups/bot/[slug]/page.tsx` | BOT結果ページ（ルート） |
| `bot/ui/components/matchup/BotViewToggle.tsx` | ADC / SUP の視点トグル |
| `bot/ui/components/matchup/BotRecommended.tsx` | 推奨セットの統合1パネル（元は `RecommendedPanels.tsx` 内） |
| `bot/ui/components/search/BotSearchForm.tsx` / `BotSlot.tsx` / `BotProgressBar.tsx` | 検索のBOTタブ一式 |
| `bot/ui/components/search/SearchTabs.tsx` | 通常レーン / BOT の2タブ（T-1300 でタブ自体を廃止） |
| `bot/ui/lib/bot-fragments.ts` | `lib/{types,slug,data,seo,history}.ts`・`app/sitemap.ts`・`RecentSearches.tsx` から削除した断片 |
| `bot/queue-rows.csv` | `scripts/queue/matchups.csv` から削除した `kind=bot` の7行 |
| `bot/bot_v1.md.j2` | BOT用プロンプトテンプレート（`scripts/prompts/` から移動） |

> プロンプトも他のBOT資産と同様にここへ退避してある。生成方式はリポジトリ上で秘匿しない方針
> （PRD §6・[09_data_pipeline.md](../09_data_pipeline.md) §3.4。2026-08-08 明確化。旧 T-905 は廃番）。

**JG は退避対象がデータだけ**である点に注意する。`Lane` 型・`LANE_LABELS`・`queue add --lane` は
`jg` を受け付けたままで、`data/matchups/jg/` に JSON を戻せば復活する。キューCSVの JG 行は
削除せず `status=skip` にしてある。

## 復活手順

仕様は [06_ui.md](../06_ui.md) §8（UI）と [09_data_pipeline.md](../09_data_pipeline.md) §9（生成）に
アーカイブしてある。復活の判断は T-1308。

1. `bot/data/` のJSONを `data/matchups/{bot,jg}/` へ戻す（`.gitkeep` は消してよい）
2. `bot/ui/` のコードを元の位置へ戻し、`bot/ui/lib/bot-fragments.ts` の断片を各ファイルへ配り直す
   （`BotRecommended.tsx` は `components/matchup/RecommendedPanels.tsx` へ統合し、`_shared` からの import を消す）
3. Python 側の Bot モデル（`schema.py`）と `validate` / `ingest` / `prompt` / `review` の分岐を復元する
4. `bot/queue-rows.csv` の行を `scripts/queue/matchups.csv` へ戻し、`queue add --kind` に `bot` を戻す
5. `bot/bot_v1.md.j2` を `scripts/prompts/` へ戻す
6. **プロンプトは lane 側の最新版に合わせて作り直す** — アーカイブ版は v1 系で、P13（T-1307）の改訂を反映していない
7. 09 §9.3 の復活チェックリストを実行する

### 注意

- **`data/matchups/{jg,bot}/` の空ディレクトリは削除しないこと。** `lib/data.ts` が `readdirSync` で
  走査しており、ディレクトリが存在しないと例外を投げてビルドが落ちる（[03_database.md](../03_database.md) §2）
- 検索UIは T-1401 で1ページ完結・レーン5択に変わっている。**タブとして戻すのではなく
  ADC / SUP を活性化する形**にする（06_ui §8 の「復活時の注意」）
