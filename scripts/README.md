# Metaたろう データ生成パイプライン（Phase 1）

ChatGPT Plus の web チャットで対面アドバイスを生成し、Python で検証して `data/matchups/` に書き出す半自動パイプライン。
設計は [docs/09_data_pipeline.md](../docs/09_data_pipeline.md) を正とする。プロンプトの中身は対外発信では説明しないが、リポジトリ上は公開している（09 §3.4）。

## 前提

- [uv](https://docs.astral.sh/uv/)（Python 3.12+ を自動解決）と Node.js（`npm run data` 経由で呼ぶため）
- 初回のみ: `npm run data -- ddragon sync`（Data Dragon の ja_JP データを `scripts/.cache/` へ取得）

## 1対面を生成する手順

### 通常レーン（例: `mid/ahri-vs-zed`）

```bash
# 0. キューにない対面なら先に追加する
npm run data -- queue add --kind lane --lane mid --me ahri --enemy zed --priority 1

# 1. プロンプト生成（クリップボードに入る）
npm run data -- prompt mid/ahri-vs-zed

# 2. ChatGPT Plus の web チャットに貼り付けて送信する（UIの自動操作は規約違反のため禁止）

# 3. 応答をそのまま generated/inbox/mid/ahri-vs-zed.json に保存する
#    （```json フェンスや前後の説明文が混ざったままでよい）

# 4. 取り込み（フェンス除去 → スキーマ検証 → 名前解決 → 最終検証 → 書き出し）
npm run data -- ingest mid/ahri-vs-zed
#    OK → data/matchups/mid/ahri-vs-zed.json が生成され status=valid
#    NG → 理由が表示され generated/rejected/ へ退避、status=invalid

# 5. 表示確認
npm run dev   # → http://localhost:3000/matchups/mid/ahri-vs-zed
```

### BOT（2v2。例: `bot/jinx-thresh-vs-ashe-leona`）

視点ごとに2回生成し、両方揃ってから ingest する。

```bash
npm run data -- prompt bot/jinx-thresh-vs-ashe-leona --view adc   # → {slug}.adc.json に保存
npm run data -- prompt bot/jinx-thresh-vs-ashe-leona --view sup   # → {slug}.sup.json に保存
npm run data -- ingest bot/jinx-thresh-vs-ashe-leona
```

## レビューと公開

```bash
npm run data -- validate --all    # PR前に必須。data/matchups/ 全件を再検証
npm run data -- review            # generated/review/review-{patch}.csv を出力し Excel で確認
                                  # warnings 列が空でない行は必ず目視（曖昧解決の混入）
# data/{patch} ブランチで PR → Vercel Preview 確認 → マージ
npm run data -- queue set-status mid/ahri-vs-zed published --patch 26.13
```

## 検証に失敗したら

- エラー内容はコンソールとキューCSVの `notes` に残る。原文は `generated/rejected/` にある
- 名前が解決できない場合: 正式名を確認して `aliases.json` に「表記ゆれ → 正式名」を1行追加し、再 ingest（`--force`）
- 内容の問題（文字数・敬体・断定表現など）: ChatGPT に修正を指示して応答を上書き保存 → 再 ingest

## 保守

| いつ | すること |
|---|---|
| パッチ更新時 | `lib/ddragon.ts` の `DDRAGON_VERSION` を更新 → `ddragon sync` → `champions sync` → `validate --all` |
| 新チャンピオン追加時 | `champion_lanes.json` にレーン適性を追記（忘れると `champions sync` がエラーで止まる） |
| `lib/types.ts` を変えたとき | `check-drift` が ingest / validate の先頭で自動検出する。`schema.py` を追随させる |
| Excel でキューCSVを開いたまま | ingest / set-status が置換エラーになる。閉じてから再実行 |

キューCSV（`queue/matchups.csv`）は Excel で開ける（utf-8-sig / CRLF）。**行の並べ替え・列の追加は
しない**こと（スクリプトは行順・列順を保存するが、人手の破壊的編集までは守れない）。
