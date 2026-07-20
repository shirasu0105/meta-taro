"""data/champions.json の再生成（champions sync）。

championFull.json(ja_JP) の全チャンピオンに、scripts/champion_lanes.json の
レーン適性（手作りオーバーレイ）を付与して書き出す。

- id は ddragonId の小文字（URL slug 規約。02_architecture §6）
- search は機械生成: カタカナ→ひらがな / 中黒・全角記号除去バリアント / 英語名の小文字・記号除去
  （オーバーレイの extraSearch で補完）
- 書式は既存と同じ「1チャンピオン1行」・id 昇順
- 安全確認: 既存 champions.json の id / ddragonId が新しい出力にも存在すること
  （data/matchups/ からの参照を壊さない）
"""

from __future__ import annotations

import json
import re

from . import ddragon
from .config import CHAMPIONS_JSON, CHAMPION_LANES_JSON

VALID_LANES = ("top", "jg", "mid", "adc", "sup")

# 名前から取り除く装飾記号（中黒・全角イコール・アンパサンド・空白）
_JA_STRIP_RE = re.compile(r"[・＝＆\s]")
_EN_STRIP_RE = re.compile(r"[^a-z0-9]")


def _to_hiragana(s: str) -> str:
    return "".join(
        chr(ord(c) - 0x60) if 0x30A1 <= ord(c) <= 0x30F6 else c for c in s
    )


def _build_search(ja: str, en: str, champ_id: str, extra: list[str]) -> list[str]:
    stripped = _JA_STRIP_RE.sub("", ja)
    out = [_to_hiragana(stripped), stripped]
    if ja != stripped:
        out.append(ja)
    en_lower = en.lower()
    en_stripped = _EN_STRIP_RE.sub("", en_lower)
    if en_lower != en_stripped:
        out.append(en_lower)
    out.append(en_stripped)
    if champ_id != en_stripped:
        out.append(champ_id)
    out.extend(extra)
    seen: set[str] = set()
    return [s for s in out if s and not (s in seen or seen.add(s))]


def _format_entry(c: dict) -> str:
    search = ", ".join(json.dumps(s, ensure_ascii=False) for s in c["search"])
    lanes = ", ".join(json.dumps(lane) for lane in c["lanes"])
    return (
        f'  {{ "id": "{c["id"]}", "ddragonId": "{c["ddragonId"]}", '
        f'"name": {{ "ja": "{c["name"]["ja"]}", "en": "{c["name"]["en"]}" }}, '
        f'"search": [{search}], "lanes": [{lanes}] }}'
    )


def sync() -> int:
    champs_ja = ddragon.load_champion_full()
    champs_en = ddragon.load_champion_en()
    overlay = json.loads(CHAMPION_LANES_JSON.read_text(encoding="utf-8"))
    lanes_map: dict[str, list[str]] = overlay["lanes"]
    extra_map: dict[str, list[str]] = overlay.get("extraSearch", {})

    problems: list[str] = []
    for ddragon_id in champs_ja:
        if ddragon_id not in lanes_map:
            problems.append(f"champion_lanes.json に {ddragon_id} がない（新チャンピオン？）")
    for ddragon_id, lanes in lanes_map.items():
        if ddragon_id not in champs_ja:
            problems.append(f"champion_lanes.json の {ddragon_id} が Data Dragon に存在しない")
        if not lanes or any(lane not in VALID_LANES for lane in lanes):
            problems.append(f"champion_lanes.json の {ddragon_id} の lanes が不正: {lanes}")
    for ddragon_id in extra_map:
        if ddragon_id not in champs_ja:
            problems.append(f"extraSearch の {ddragon_id} が Data Dragon に存在しない")
    if problems:
        print("champions sync: オーバーレイに問題がある")
        for p in problems:
            print(f"  {p}")
        return 1

    entries = []
    for ddragon_id, champ in champs_ja.items():
        en_name = champs_en.get(ddragon_id, {}).get("name")
        if not en_name:
            print(f"champions sync: en_US に {ddragon_id} が見つからない")
            return 1
        champ_id = ddragon_id.lower()
        entries.append(
            {
                "id": champ_id,
                "ddragonId": ddragon_id,
                "name": {"ja": champ["name"], "en": en_name},
                "search": _build_search(
                    champ["name"], en_name, champ_id, extra_map.get(ddragon_id, [])
                ),
                "lanes": lanes_map[ddragon_id],
            }
        )
    entries.sort(key=lambda c: c["id"])

    # 既存マスタからの参照を壊していないか（id / ddragonId の同一性）
    current = {c["id"]: c for c in json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))}
    new_by_id = {c["id"]: c for c in entries}
    for champ_id, cur in current.items():
        new = new_by_id.get(champ_id)
        if new is None:
            print(f"champions sync: 既存の id「{champ_id}」が新しい出力に存在しない。中止")
            return 1
        if new["ddragonId"] != cur["ddragonId"]:
            print(
                f"champions sync: 「{champ_id}」の ddragonId が変わる"
                f"（{cur['ddragonId']} → {new['ddragonId']}）。中止"
            )
            return 1

    body = "[\n" + ",\n".join(_format_entry(c) for c in entries) + "\n]\n"
    with open(CHAMPIONS_JSON, "w", encoding="utf-8", newline="\n") as f:
        f.write(body)
    print(f"champions sync: {len(entries)}体を書き出した（既存 {len(current)}体 → {len(entries)}体）")
    return 0
