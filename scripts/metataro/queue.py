"""作業キューCSV（docs/09_data_pipeline.md §7.2）。

Excel互換の実装要件:
- 読み書きとも encoding="utf-8-sig"（日本語WindowsのExcelで文字化けしない）
- open(..., newline="") + csv.DictWriter(..., lineterminator="\\r\\n")
- 行順・列順を絶対に変えない（既存行を読み、該当セルのみ更新し、元の順で書き戻す）
- 一時ファイル → os.replace のアトミック置換。Excelで開いたままなら明示エラー
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from datetime import date

from .config import CHAMPIONS_JSON, LANES, QUEUE_CSV

FIELDNAMES = [
    "id", "kind", "lane", "me", "enemy",
    "my_adc", "my_sup", "enemy_adc", "enemy_sup",
    "slug", "priority", "status", "prompt_version",
    "generated_at", "validated_at", "published_patch", "notes",
]

VALID_STATUSES = (
    "todo", "prompted", "drafted", "valid", "invalid", "rejected", "published", "skip"
)


def read_queue() -> tuple[list[str], list[dict[str, str]]]:
    with open(QUEUE_CSV, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    if not fieldnames:
        raise SystemExit(f"エラー: {QUEUE_CSV} にヘッダー行がない")
    return fieldnames, rows


def write_queue(fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    tmp = QUEUE_CSV.with_suffix(".csv.tmp")
    with open(tmp, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)
    try:
        os.replace(tmp, QUEUE_CSV)
    except PermissionError:
        tmp.unlink(missing_ok=True)
        raise SystemExit(
            f"エラー: {QUEUE_CSV} を置換できない。Excelで開いたままになっていないか確認する"
        )


def find_row(rows: list[dict[str, str]], matchup_id: str) -> dict[str, str]:
    for row in rows:
        if row["id"] == matchup_id:
            return row
    raise SystemExit(f"エラー: キューに id「{matchup_id}」の行がない（queue list で確認）")


def update_row(matchup_id: str, **fields: str) -> None:
    """該当行の指定セルだけを更新して書き戻す（行順・列順は不変）。"""
    fieldnames, rows = read_queue()
    row = find_row(rows, matchup_id)
    for key, value in fields.items():
        if key not in fieldnames:
            raise SystemExit(f"エラー: キューCSVに列「{key}」がない")
        row[key] = value
    write_queue(fieldnames, rows)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _load_master() -> dict[str, dict]:
    return {c["id"]: c for c in json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))}


def _require_champion(master: dict, champ_id: str | None, role: str, label: str) -> str:
    if not champ_id:
        raise SystemExit(f"エラー: {label} を指定する")
    entry = master.get(champ_id)
    if entry is None:
        raise SystemExit(f"エラー: {label}「{champ_id}」が champions.json に存在しない")
    if role not in entry["lanes"]:
        raise SystemExit(
            f"エラー: {label}「{champ_id}」の lanes {entry['lanes']} に {role} がない"
        )
    return champ_id


def new_row(**values: str) -> dict[str, str]:
    row = {name: "" for name in FIELDNAMES}
    row.update(values)
    return row


def cmd_add(args: argparse.Namespace) -> int:
    """kind=bot の追加は T-1300 で削除した。`my_adc` 等の列は復活に備えて残す（09 §7.2）。"""
    master = _load_master()
    if args.lane not in LANES:
        raise SystemExit("エラー: --lane top|jg|mid を指定する")
    me = _require_champion(master, args.me, args.lane, "--me")
    enemy = _require_champion(master, args.enemy, args.lane, "--enemy")
    if me == enemy:
        raise SystemExit("エラー: --me と --enemy が同一")
    slug = f"{me}-vs-{enemy}"
    row = new_row(
        id=f"{args.lane}/{slug}", kind="lane", lane=args.lane, me=me, enemy=enemy,
        slug=slug, priority=str(args.priority), status="todo",
    )
    if not 1 <= args.priority <= 5:
        raise SystemExit("エラー: --priority は 1〜5")

    fieldnames, rows = read_queue()
    if any(r["id"] == row["id"] for r in rows):
        raise SystemExit(f"エラー: id「{row['id']}」は既にキューにある")
    rows.append({name: row.get(name, "") for name in fieldnames})
    write_queue(fieldnames, rows)
    print(f"追加: {row['id']}（priority={row['priority']}, status=todo）")
    return 0


def cmd_list(status: str | None = None) -> int:
    _, rows = read_queue()
    if status:
        rows = [r for r in rows if r["status"] == status]
    if not rows:
        print("該当する行がない")
        return 0
    width = max(len(r["id"]) for r in rows)
    for r in rows:
        note = f"  {r['notes']}" if r["notes"] else ""
        patch = f"  patch={r['published_patch']}" if r["published_patch"] else ""
        print(f"{r['id']:<{width}}  {r['kind']:<4} p{r['priority']} {r['status']:<9}{patch}{note}")
    print(f"\n{len(rows)}件")
    return 0


def cmd_set_status(matchup_id: str, status: str, patch: str | None = None) -> int:
    if status not in VALID_STATUSES:
        raise SystemExit(f"エラー: status は {'/'.join(VALID_STATUSES)} のいずれか")
    fields: dict[str, str] = {"status": status}
    if status == "published":
        if not patch:
            raise SystemExit("エラー: published にする場合は --patch を指定する")
        fields["published_patch"] = patch
    elif patch:
        raise SystemExit("エラー: --patch は published にする場合のみ指定できる")
    update_row(matchup_id, **fields)
    print(f"{matchup_id}: status={status}" + (f", published_patch={patch}" if patch else ""))
    return 0


def today() -> str:
    return date.today().isoformat()
