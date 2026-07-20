"""取り込み（docs/09_data_pipeline.md §1 手順4〜7）。

generated/inbox/ の ChatGPT 応答を、
フェンス除去 → LLMスキーマ検証 → 名前解決 → 最終検証 → data/matchups/ 書き出し → キューCSV更新
の順で処理する。検証に失敗した対面は data/ に**一切書き込まず** generated/rejected/ へ原文を退避し、
status=invalid + notes に理由を記録する（部分書き込みをしない。09 §3.2）。
"""

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from . import queue as queue_mod
from . import validate as validate_mod
from .config import CHAMPIONS_JSON, INBOX_DIR, MATCHUPS_DIR, REJECTED_DIR
from .resolve import ResolveError, Resolvers
from .schema import BotAdcLLMOutput, BotSupLLMOutput, LaneLLMOutput

_FENCE_RE = re.compile(r"```(?:json)?\s*\n(.*?)```", re.DOTALL)


class IngestError(Exception):
    """取り込み失敗。messages にエラー一覧を持つ。"""

    def __init__(self, messages: list[str]):
        super().__init__("; ".join(messages))
        self.messages = messages


def _extract_json(text: str) -> Any:
    """```json フェンスの中身を取り出して parse する。フェンスがなければ全文を試す。"""
    m = _FENCE_RE.search(text)
    payload = m.group(1) if m else text
    try:
        return json.loads(payload)
    except json.JSONDecodeError as e:
        raise IngestError([f"JSONとして読めない: {e}"])


def _normalize(value: Any) -> Any:
    """F. 正規化のうち文字列部分（NFC + 前後空白除去）を取り込み時に適用する。"""
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value).strip()
    if isinstance(value, dict):
        return {k: _normalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize(v) for v in value]
    return value


def _validate_llm(model: type, obj: Any) -> Any:
    try:
        return model.model_validate(obj)
    except ValidationError as e:
        messages = []
        for err in e.errors():
            loc = ".".join(str(x) for x in err["loc"])
            messages.append(f"{loc or '(root)'}: {err['msg']}")
        raise IngestError(messages)


def _resolve_advice(
    r: Resolvers,
    llm: LaneLLMOutput | BotSupLLMOutput,
    enemy_ddragon_ids: set[str],
    warnings: list[str],
    include_game_plan: bool,
) -> dict:
    """LLM出力1視点分を最終スキーマの形へ解決する（09 §3.2 の表）。"""
    errors: list[str] = []

    danger_skills = []
    for i, ds in enumerate(llm.dangerSkills):
        try:
            ddragon_id = r.champions.lookup(ds.champion, warnings)
            if ddragon_id not in enemy_ddragon_ids:
                errors.append(
                    f"dangerSkills[{i}]: 「{ds.champion}」は相手チャンピオンではない"
                    "（dangerSkills には相手のスキルのみを挙げる）"
                )
                continue
            skill = r.resolve_skill(ds.champion, ds.slot, warnings)
        except ResolveError as e:
            errors.append(f"dangerSkills[{i}]: {e}")
            continue
        danger_skills.append(
            {
                "slot": ds.slot,
                "name": skill["name"],
                "tag": ds.tag,
                "description": ds.description,
                "icon": skill["icon"],
            }
        )

    rec = llm.recommended
    runes: dict = {}
    try:
        runes = r.resolve_runes(rec.runes.keystone, rec.runes.primary, rec.runes.secondary, warnings)
    except ResolveError as e:
        errors.append(f"runes: {e}")

    spells: list[str] = []
    for name in rec.spells:
        try:
            spells.append(r.resolve_spell(name, warnings))
        except ResolveError as e:
            errors.append(f"spells: {e}")
    if len(set(spells)) != len(spells):
        errors.append(f"spells: 解決後に重複した {spells}")

    def item_of(name: str, where: str) -> dict | None:
        try:
            return r.resolve_item(name, warnings)
        except ResolveError as e:
            errors.append(f"{where}: {e}")
            return None

    core = [item_of(name, f"core[{i}]") for i, name in enumerate(rec.build.core)]
    boots = item_of(rec.build.boots, "boots")
    situational = []
    for i, s in enumerate(rec.build.situational):
        item = item_of(s.item, f"situational[{i}]")
        if item:
            situational.append({"item": item, "reason": s.reason})

    glossary_refs = r.resolve_terms(llm.glossaryTerms, warnings)

    if errors:
        raise IngestError(errors)

    advice = {"summary": llm.summary}
    if include_game_plan:
        advice["gamePlan"] = llm.gamePlan.model_dump()
    advice.update(
        dangerSkills=danger_skills,
        powerSpike=llm.powerSpike.model_dump(),
        recommended={
            "runes": runes,
            "spells": spells,
            "build": {"core": core, "boots": boots, "situational": situational},
        },
        glossaryRefs=glossary_refs,
    )
    return advice


def _read_inbox(path: Path) -> str:
    if not path.exists():
        raise IngestError([f"{path} がない（ChatGPT応答を保存する）"])
    return path.read_text(encoding="utf-8")


def _build_final(row: dict, r: Resolvers, warnings: list[str]) -> tuple[dict, Path, list[Path]]:
    """キュー行から inbox を読み、最終スキーマの dict と書き出し先を組み立てる。"""
    master = {c["id"]: c for c in json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))}

    if row["kind"] == "lane":
        inbox = INBOX_DIR / row["lane"] / f"{row['slug']}.json"
        raw = _normalize(_extract_json(_read_inbox(inbox)))
        llm = _validate_llm(LaneLLMOutput, raw)
        enemy_ids = {master[row["enemy"]]["ddragonId"]}
        advice = _resolve_advice(r, llm, enemy_ids, warnings, include_game_plan=True)
        final = {
            "lane": row["lane"],
            "me": row["me"],
            "enemy": row["enemy"],
            "aiRating": llm.aiRating,
            "advantage": llm.advantage,
            **advice,
        }
        out_path = MATCHUPS_DIR / row["lane"] / f"{row['slug']}.json"
        return final, out_path, [inbox]

    inbox_adc = INBOX_DIR / "bot" / f"{row['slug']}.adc.json"
    inbox_sup = INBOX_DIR / "bot" / f"{row['slug']}.sup.json"
    missing = [str(p) for p in (inbox_adc, inbox_sup) if not p.exists()]
    if missing:
        raise IngestError(
            [f"BOTは両視点が揃ってから取り込む。不足: {' / '.join(missing)}"]
        )
    adc_llm = _validate_llm(BotAdcLLMOutput, _normalize(_extract_json(_read_inbox(inbox_adc))))
    sup_llm = _validate_llm(BotSupLLMOutput, _normalize(_extract_json(_read_inbox(inbox_sup))))
    enemy_ids = {
        master[row["enemy_adc"]]["ddragonId"],
        master[row["enemy_sup"]]["ddragonId"],
    }
    adc_warnings: list[str] = []
    sup_warnings: list[str] = []
    adc_view = _resolve_advice(r, adc_llm, enemy_ids, adc_warnings, include_game_plan=False)
    sup_view = _resolve_advice(r, sup_llm, enemy_ids, sup_warnings, include_game_plan=False)
    warnings.extend(f"adc: {w}" for w in adc_warnings)
    warnings.extend(f"sup: {w}" for w in sup_warnings)
    final = {
        "myAdc": row["my_adc"],
        "mySup": row["my_sup"],
        "enemyAdc": row["enemy_adc"],
        "enemySup": row["enemy_sup"],
        "aiRating": adc_llm.aiRating,
        "advantage": adc_llm.advantage,
        "views": {"adc": adc_view, "sup": sup_view},
    }
    out_path = MATCHUPS_DIR / "bot" / f"{row['slug']}.json"
    return final, out_path, [inbox_adc, inbox_sup]


def _reject(row: dict, inboxes: list[Path], messages: list[str]) -> None:
    """原文を generated/rejected/ へ退避し、キューに理由を記録する。"""
    for inbox in inboxes:
        if inbox.exists():
            dest = REJECTED_DIR / inbox.relative_to(INBOX_DIR)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(inbox, dest)
    summary = " / ".join(messages[:3]) + (f"（他{len(messages) - 3}件）" if len(messages) > 3 else "")
    queue_mod.update_row(row["id"], status="invalid", notes=summary)


def run(matchup_id: str, force: bool = False) -> int:
    if validate_mod.check_drift() != 0:
        return 1
    row = queue_mod.find_row(queue_mod.read_queue()[1], matchup_id)
    if row["status"] == "skip":
        print(f"エラー: {matchup_id} は skip（意図的な未作成）。取り込まない")
        return 1
    return _ingest_row(row, force)


def _ingest_row(row: dict, force: bool) -> int:
    r = Resolvers()
    warnings: list[str] = []
    if row["kind"] == "lane":
        inboxes = [INBOX_DIR / row["lane"] / f"{row['slug']}.json"]
    else:
        inboxes = [
            INBOX_DIR / "bot" / f"{row['slug']}.adc.json",
            INBOX_DIR / "bot" / f"{row['slug']}.sup.json",
        ]

    try:
        final, out_path, inboxes = _build_final(row, r, warnings)

        if out_path.exists() and not force:
            raise IngestError(
                [f"{out_path} は既に存在する。上書きするなら --force（09 §4-E）"]
            )

        master = validate_mod._load_master()
        glossary_slugs = validate_mod._load_glossary_slugs()
        errors = validate_mod.validate_object(out_path, final, r, master, glossary_slugs)
        if errors:
            raise IngestError(errors)
    except IngestError as e:
        print(f"NG   {row['id']}")
        for msg in e.messages:
            print(f"     {msg}")
        _reject(row, inboxes, e.messages)
        print(f"     → generated/rejected/ へ退避し status=invalid にした")
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(final, f, indent=2, ensure_ascii=False)
        f.write("\n")

    today = queue_mod.today()
    queue_mod.update_row(
        row["id"],
        status="valid",
        generated_at=today,
        validated_at=today,
        notes="; ".join(warnings),
    )
    print(f"OK   {row['id']} → {out_path}")
    if warnings:
        print("     warnings（レビューCSVで必ず目視する）:")
        for w in warnings:
            print(f"       {w}")
    return 0


def scan(force: bool = False) -> int:
    """inbox の全ファイルを一括処理する。"""
    if validate_mod.check_drift() != 0:
        return 1
    if not INBOX_DIR.exists():
        print(f"{INBOX_DIR} がない")
        return 1
    ids: list[str] = []
    for path in sorted(INBOX_DIR.rglob("*.json")):
        lane = path.parent.name
        stem = path.stem
        if lane == "bot":
            stem = re.sub(r"\.(adc|sup)$", "", stem)
        matchup_id = f"{lane}/{stem}"
        if matchup_id not in ids:
            ids.append(matchup_id)
    if not ids:
        print("inbox が空")
        return 0
    _, rows = queue_mod.read_queue()
    failed = 0
    for matchup_id in ids:
        try:
            row = queue_mod.find_row(rows, matchup_id)
        except SystemExit:
            print(f"NG   {matchup_id}: キューに行がない（queue add してから ingest する）")
            failed += 1
            continue
        if row["status"] == "skip":
            print(f"SKIP {matchup_id}: skip 行のため取り込まない")
            continue
        if _ingest_row(row, force) != 0:
            failed += 1
    return 1 if failed else 0
