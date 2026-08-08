"""metataro CLI（docs/09_data_pipeline.md §7.3）。

npm run data -- <command> で呼ばれる。追加依存を避けるため argparse で実装する。
"""

from __future__ import annotations

import argparse
import sys


def _cmd_ddragon(args: argparse.Namespace) -> int:
    from . import ddragon

    if args.action == "sync":
        return ddragon.sync(force=args.force)
    raise AssertionError(args.action)


def _cmd_champions(args: argparse.Namespace) -> int:
    from . import champions

    if args.action == "sync":
        return champions.sync()
    raise AssertionError(args.action)


def _cmd_prompt(args: argparse.Namespace) -> int:
    from . import prompt

    return prompt.run(args.id, stdout=args.stdout)


def _cmd_ingest(args: argparse.Namespace) -> int:
    from . import ingest

    if args.scan:
        return ingest.scan(force=args.force)
    if not args.id:
        print("エラー: 対面ID（例 mid/ahri-vs-annie）か --scan を指定する", file=sys.stderr)
        return 2
    return ingest.run(args.id, force=args.force)


def _cmd_validate(args: argparse.Namespace) -> int:
    from . import validate

    if args.all:
        return validate.run_all()
    if not args.id:
        print("エラー: 対面ID（例 mid/ahri-vs-annie）か --all を指定する", file=sys.stderr)
        return 2
    return validate.run_one(args.id)


def _cmd_review(args: argparse.Namespace) -> int:
    from . import review

    return review.run(patch=args.patch)


def _cmd_queue(args: argparse.Namespace) -> int:
    from . import queue

    if args.action == "add":
        return queue.cmd_add(args)
    if args.action == "list":
        return queue.cmd_list(status=args.status)
    if args.action == "set-status":
        return queue.cmd_set_status(args.id, args.status, patch=args.patch)
    raise AssertionError(args.action)


def _cmd_check_drift(args: argparse.Namespace) -> int:
    from . import validate

    return validate.check_drift()


def _cmd_resolve(args: argparse.Namespace) -> int:
    from . import resolve

    if args.check_mocks:
        return resolve.check_mocks()
    print("エラー: --check-mocks を指定する（単体実行は ingest 経由で使われる）", file=sys.stderr)
    return 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="metataro",
        description="Metaたろう データ生成パイプライン Phase 1（docs/09_data_pipeline.md）",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("ddragon", help="Data Dragon キャッシュ管理")
    ps = p.add_subparsers(dest="action", required=True)
    p_sync = ps.add_parser("sync", help="ja_JP の4ファイルを scripts/.cache/ へ取得")
    p_sync.add_argument("--force", action="store_true", help="キャッシュ済みでも再取得する")
    p_sync.set_defaults(func=_cmd_ddragon)

    p = sub.add_parser("champions", help="data/champions.json の再生成")
    ps = p.add_subparsers(dest="action", required=True)
    p_csync = ps.add_parser("sync", help="championFull.json + champion_lanes.json から再生成")
    p_csync.set_defaults(func=_cmd_champions)

    p = sub.add_parser("prompt", help="プロンプト生成（クリップボードへ）")
    p.add_argument("id", help="対面ID（例 mid/ahri-vs-annie）")
    p.add_argument("--stdout", action="store_true", help="クリップボードでなく標準出力へ")
    p.set_defaults(func=_cmd_prompt)

    p = sub.add_parser("ingest", help="inbox → 解決 → 検証 → data/ 書き出し")
    p.add_argument("id", nargs="?", help="対面ID。省略時は --scan")
    p.add_argument("--scan", action="store_true", help="inbox の全ファイルを一括処理")
    p.add_argument("--force", action="store_true", help="data/ の既存ファイルを上書きする")
    p.set_defaults(func=_cmd_ingest)

    p = sub.add_parser("validate", help="data/matchups/ の検証（09 §4 A〜F）")
    p.add_argument("id", nargs="?", help="対面ID。省略時は --all")
    p.add_argument("--all", action="store_true", help="data/matchups/ 全件を検証")
    p.set_defaults(func=_cmd_validate)

    p = sub.add_parser("review", help="レビューCSVを generated/review/ へ出力")
    p.add_argument("--patch", help="ファイル名に使うパッチ（省略時は data/meta.json の値）")
    p.set_defaults(func=_cmd_review)

    p = sub.add_parser("queue", help="作業キューCSVの操作")
    ps = p.add_subparsers(dest="action", required=True)
    p_add = ps.add_parser("add", help="キューへ行を追加")
    # kind=bot は T-1300 で削除（CSVの列と `bot` という値そのものは復活に備えて残す。09 §7.2）
    p_add.add_argument("--kind", choices=["lane"], default="lane")
    p_add.add_argument("--lane", choices=["top", "jg", "mid"], required=True)
    p_add.add_argument("--me", required=True, help="自分の champion id")
    p_add.add_argument("--enemy", required=True, help="相手の champion id")
    p_add.add_argument("--priority", type=int, default=3, help="1(最優先)〜5")
    p_add.set_defaults(func=_cmd_queue)
    p_list = ps.add_parser("list", help="キューの一覧表示")
    p_list.add_argument("--status", help="status で絞り込み（例 todo）")
    p_list.set_defaults(func=_cmd_queue)
    p_set = ps.add_parser("set-status", help="status の更新（該当セルのみ書き換え）")
    p_set.add_argument("id", help="対面ID")
    p_set.add_argument("status", help="todo/prompted/drafted/valid/invalid/rejected/published/skip")
    p_set.add_argument("--patch", help="published にする際の published_patch")
    p_set.set_defaults(func=_cmd_queue)

    p = sub.add_parser("check-drift", help="lib/types.ts と pydantic モデルの整合確認")
    p.set_defaults(func=_cmd_check_drift)

    p = sub.add_parser("resolve", help="名前解決の点検")
    p.add_argument("--check-mocks", action="store_true", help="data/matchups/ 全件の識別子を復元して照合")
    p.set_defaults(func=_cmd_resolve)

    return parser


def main(argv: list[str] | None = None) -> int:
    # 日本語Windowsのコンソール（cp932）でも出力が落ちないようにする
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
