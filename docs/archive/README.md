# docs/archive

スコープ外にした機能の退避先。**ビルド対象外**であり、ここのファイルはアプリから参照されない。

## bot/ — BOT（2v2）対面

2026-08-07 のインタビューで、TOP / MID にリソースを集中する方針となり当面のスコープ外にした
（[05_tasks.md](../05_tasks.md) の T-1300）。将来 BOT を実装する際の参考資料として保管する。

> **T-1300 実施時にこのディレクトリを作成する。** 本節はその時点で退避物の実際の一覧に更新すること。

### 保管予定の内容

| パス | 内容 |
|---|---|
| `bot/data/bot/*.json` | BOT対面3件（`jinx-thresh-vs-caitlyn-lulu` / `jinx-thresh-vs-ashe-leona` / `ezreal-lux-vs-ashe-leona`） |
| `bot/data/jg/*.json` | JG対面3件（`leesin-vs-vi` / `vi-vs-leesin` / `graves-vs-kayn`） |
| `bot/ui/` | BOT専用のルート・コンポーネント・型・データアクセス・slug・SEOヘルパー |
| `bot/queue-rows.csv` | `scripts/queue/matchups.csv` から削除した `kind=bot` の行 |
| `bot/bot_v1.md.j2` | BOT用プロンプトテンプレート（`scripts/prompts/` から移動） |

> プロンプトも他のBOT資産と同様にここへ退避する。生成方式はリポジトリ上で秘匿しない方針
> （PRD §6・[09_data_pipeline.md](../09_data_pipeline.md) §3.4。2026-08-08 明確化。旧 T-905 は廃番）。

## 復活手順

仕様は [06_ui.md](../06_ui.md) §8（UI）と [09_data_pipeline.md](../09_data_pipeline.md) §9（生成）に
アーカイブしてある。復活の判断は T-1308。

1. `bot/data/` のJSONを `data/matchups/{bot,jg}/` へ戻す
2. `bot/ui/` のコードを元の位置へ戻し、`lib/types.ts` / `sitemap.ts` / pydanticモデルを復元する
3. `bot/queue-rows.csv` の行を `scripts/queue/matchups.csv` へ戻す
4. `bot/bot_v1.md.j2` を `scripts/prompts/` へ戻す
5. **プロンプトは lane 側の最新版に合わせて作り直す** — アーカイブ版は v1 系で、P13（T-1307）の改訂を反映していない
6. 09 §9.3 の復活チェックリストを実行する

### 注意

- **`data/matchups/{jg,bot}/` の空ディレクトリは削除しないこと。** `lib/data.ts` が `readdirSync` で
  走査しており、ディレクトリが存在しないと例外を投げてビルドが落ちる（[03_database.md](../03_database.md) §2）
- 検索UIは T-1401 で1ページ完結・レーン5択に変わっている。**タブとして戻すのではなく
  ADC / SUP を活性化する形**にする（06_ui §8 の「復活時の注意」）
