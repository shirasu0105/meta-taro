"""プロンプト生成（docs/09_data_pipeline.md §3.3）。

キューCSVの対面情報 + Data Dragon のチャンピオン事実をテンプレートに注入し、
クリップボードへコピーする。ChatGPT Plus の web チャットに人手で貼り付けて使う
（UIの自動操作は行わない。09 §3.1）。
"""

from __future__ import annotations

import html
import json
import re

from jinja2 import Environment, FileSystemLoader

from . import ddragon
from . import queue as queue_mod
from .config import CHAMPIONS_JSON, GLOSSARY_JSON, INBOX_DIR, PROMPTS_DIR
from .schema import LIMITS

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_SUMMARY_MAX = 130  # スキル効果要約の注入上限（プロンプト肥大の抑制）


def _strip_html(text: str) -> str:
    s = html.unescape(_TAG_RE.sub(" ", text))
    s = _WS_RE.sub(" ", s).strip()
    if len(s) > _SUMMARY_MAX:
        s = s[: _SUMMARY_MAX - 1] + "…"
    return s


def _champion_facts(master_entry: dict, champs_full: dict) -> dict:
    """§2 に注入するチャンピオン事実（P/Q/W/E/R の正式名と効果要約）。"""
    champ = champs_full[master_entry["ddragonId"]]
    skills = [
        {
            "slot": "P",
            "name": champ["passive"]["name"],
            "summary": _strip_html(champ["passive"]["description"]),
        }
    ]
    for slot, spell in zip("QWER", champ["spells"]):
        skills.append(
            {"slot": slot, "name": spell["name"], "summary": _strip_html(spell["description"])}
        )
    return {"ja": master_entry["name"]["ja"], "en": master_entry["name"]["en"], "skills": skills}


def _vocab() -> dict:
    glossary = json.loads(GLOSSARY_JSON.read_text(encoding="utf-8"))
    summoners = ddragon.load_summoners()
    spell_names = sorted(
        sp["name"] for sp in summoners.values() if "CLASSIC" in sp.get("modes", [])
    )
    keystone_lines = []
    tree_names = []
    for tree in ddragon.load_runes():
        tree_names.append(tree["name"])
        names = " / ".join(r["name"] for r in tree["slots"][0]["runes"])
        keystone_lines.append(f"{tree['name']}: {names}")
    return {
        "glossary_terms": [g["term"] for g in glossary],
        "spell_names": spell_names,
        "keystone_lines": keystone_lines,
        "tree_names": tree_names,
    }


LANE_LABELS = {"top": "TOP（トップレーン）", "jg": "JG（ジャングル）", "mid": "MID（ミッドレーン）"}


def run(matchup_id: str, view: str | None = None, stdout: bool = False) -> int:
    row = queue_mod.find_row(queue_mod.read_queue()[1], matchup_id)
    if row["status"] == "skip":
        raise SystemExit(f"エラー: {matchup_id} は skip（意図的な未作成）。生成しない")

    master = {c["id"]: c for c in json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))}
    champs_full = ddragon.load_champion_full()
    ctx: dict = {"limits": LIMITS, **_vocab()}

    if row["kind"] == "lane":
        if view:
            raise SystemExit("エラー: --view は BOT 対面専用")
        template_name = "lane_v1.md.j2"
        ctx.update(
            lane_label=LANE_LABELS[row["lane"]],
            me=_champion_facts(master[row["me"]], champs_full),
            enemy=_champion_facts(master[row["enemy"]], champs_full),
        )
        inbox = INBOX_DIR / row["lane"] / f"{row['slug']}.json"
    else:
        if view not in ("adc", "sup"):
            raise SystemExit("エラー: BOT対面は --view adc または --view sup を指定する（2回に分けて生成）")
        template_name = "bot_v1.md.j2"
        ctx.update(
            view=view,
            my_adc=_champion_facts(master[row["my_adc"]], champs_full),
            my_sup=_champion_facts(master[row["my_sup"]], champs_full),
            enemy_adc=_champion_facts(master[row["enemy_adc"]], champs_full),
            enemy_sup=_champion_facts(master[row["enemy_sup"]], champs_full),
        )
        inbox = INBOX_DIR / "bot" / f"{row['slug']}.{view}.json"

    env = Environment(
        loader=FileSystemLoader(PROMPTS_DIR),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    text = env.get_template(template_name).render(**ctx)
    prompt_version = template_name.removesuffix(".md.j2")

    if stdout:
        print(text)
    else:
        try:
            import pyperclip

            pyperclip.copy(text)
            print(f"プロンプトをクリップボードにコピーした（{len(text):,}字）")
        except Exception as e:
            print(f"クリップボードへのコピーに失敗（{e}）。--stdout で出力する:")
            print(text)

    # ステータス遷移: todo → prompted（09 §7.2）。valid/published は下げない
    if row["status"] in ("todo", "prompted", "drafted", "rejected", "invalid"):
        queue_mod.update_row(matchup_id, status="prompted", prompt_version=prompt_version)
    else:
        print(f"注意: status={row['status']} のため状態は変更しない（再生成のみ）")

    inbox.parent.mkdir(parents=True, exist_ok=True)
    print()
    print("次の手順:")
    print("  1. ChatGPT Plus のwebチャットに貼り付けて送信する")
    print(f"  2. 応答の ```json ブロックをそのまま {inbox} に保存する")
    print(f"  3. npm run data -- ingest {matchup_id}")
    return 0
