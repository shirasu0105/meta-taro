"""レビューCSV出力（docs/09_data_pipeline.md §7.5）。

status ∈ {valid, published} の対面を data/ から読み直して出力する（inboxではなく確定データを見る）。

Excel互換の要件（utf-8-sig / CRLF）はキューCSVと同じ。
BOTを視点（adc/sup）ごとに1行で出す扱いは T-1300 で削除した（09 §9.2）。
`view` 列は復活時に備えて残してあり、通常レーンでは常に空。
"""

from __future__ import annotations

import csv
import json

from .config import MATCHUPS_DIR, META_JSON, REVIEW_DIR
from . import queue as queue_mod

FIELDNAMES = [
    "id", "view", "kind", "status", "ai_rating", "advantage",
    "summary_len", "summary",
    "plan_early", "plan_mid", "plan_late",
    "danger_1", "danger_2", "danger_3",
    "spike_me", "spike_enemy", "spike_note",
    "keystone", "primary", "secondary", "spells",
    "core", "boots", "situational", "glossary",
    "prompt_version", "warnings",
]


def _spike(marks: dict) -> str:
    return f"{marks['early']}{marks['mid']}{marks['late']}"


def _advice_cells(advice: dict) -> dict[str, str]:
    rec = advice["recommended"]
    build = rec["build"]
    cells = {
        "summary_len": str(len(advice["summary"])),
        "summary": advice["summary"],
        "spike_me": _spike(advice["powerSpike"]["me"]),
        "spike_enemy": _spike(advice["powerSpike"]["enemy"]),
        "spike_note": advice["powerSpike"]["note"],
        "keystone": rec["runes"]["keystone"],
        "primary": rec["runes"]["primary"],
        "secondary": rec["runes"]["secondary"],
        "spells": " / ".join(rec["spells"]),
        "core": " / ".join(it["name"] for it in build["core"]),
        "boots": build["boots"]["name"],
        "situational": " / ".join(
            f"{s['item']['name']}（{s['reason']}）" for s in build["situational"]
        ),
        "glossary": " / ".join(advice["glossaryRefs"]),
    }
    for i, ds in enumerate(advice["dangerSkills"], start=1):
        cells[f"danger_{i}"] = f"{ds['slot']}「{ds['name']}」[{ds['tag']}] {ds['description']}"
    gp = advice.get("gamePlan")
    if gp:
        cells.update(plan_early=gp["early"], plan_mid=gp["mid"], plan_late=gp["late"])
    return cells


def run(patch: str | None = None) -> int:
    if not patch:
        patch = json.loads(META_JSON.read_text(encoding="utf-8"))["patch"]

    _, queue_rows = queue_mod.read_queue()
    targets = [r for r in queue_rows if r["status"] in ("valid", "published")]
    if not targets:
        print("status が valid / published の行がキューにない")
        return 1

    out_rows: list[dict[str, str]] = []
    for row in targets:
        path = MATCHUPS_DIR / row["lane"] / f"{row['slug']}.json"
        if not path.exists():
            print(f"警告: {row['id']} は {row['status']} だが {path} が存在しない。スキップ")
            continue
        obj = json.loads(path.read_text(encoding="utf-8"))
        base = {
            "id": row["id"],
            "kind": row["kind"],
            "status": row["status"],
            "ai_rating": str(obj["aiRating"]),
            "advantage": obj["advantage"],
            "prompt_version": row["prompt_version"],
            "warnings": row["notes"],
        }
        cells = {name: "" for name in FIELDNAMES}
        cells.update(base, view="", **_advice_cells(obj))
        out_rows.append(cells)

    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REVIEW_DIR / f"review-{patch}.csv"
    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(out_rows)
    print(f"{out_path} を出力（対面{len(targets)}件 / {len(out_rows)}行）")
    return 0
