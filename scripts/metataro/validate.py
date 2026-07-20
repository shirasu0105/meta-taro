"""自動検証（docs/09_data_pipeline.md §4 の A〜F）と check-drift（§4.1）。

lib/data.ts は無検査キャストであり、この検証器が data/matchups/ の唯一のガード。
- A. 構造 / C. 文字数・件数: schema.py の最終モデル（extra="forbid"）で検証
- B. 参照整合: Data Dragon・champions.json・glossary.json との突き合わせ
- D. 表記: 常体・統計語（勝率/ピック率）・断定表現・全角数字。LLMが書く文章フィールドのみ対象
- E. ファイル: パスとJSON内容の自己整合・slug規約
- F. 正規化: NFC / 前後空白 / json.dump(indent=2) + 末尾改行1つ（改行コードは比較前に正規化。
     作業ツリーは CRLF・index は LF のため、バイト比較は禁止）
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from . import ddragon
from .config import CHAMPIONS_JSON, GLOSSARY_JSON, LANES, LIB_TYPES_TS, MATCHUPS_DIR
from .resolve import Resolvers
from .schema import INTENTIONALLY_OMITTED, TS_TYPE_TO_MODEL, BotMatchup, LaneMatchup

SLUG_RE = re.compile(r"^[a-z0-9]+$")  # lib/slug.ts の ID_PATTERN と同一

# D. 表記（対象は data/matchups/ のLLM文章フィールドのみ。P6レポート§2の申し送りどおり
# UI文言には掛けない。% 単体は「HP60%以下」等の本文表現として実在するため検出しない）
_STATS_RE = re.compile(r"勝率|ピック率")
_ASSERTIVE_RE = re.compile(r"必ず|確実に|絶対に")
_FULLWIDTH_DIGIT_RE = re.compile(r"[０-９]")
_DESUMASU_RE = re.compile(r"(です|ます)(?=。|$)")


# ---------------------------------------------------------------------------
# check-drift（09 §4.1）: lib/types.ts と pydantic モデルの突き合わせ
# ---------------------------------------------------------------------------

_FIELD_RE = re.compile(r"^\s*(\w+)(\??)\s*:")


def _parse_ts_types(text: str) -> dict[str, dict[str, bool]]:
    """export type X = {...} からトップレベルのフィールド名と optional フラグを抽出する。"""
    src = "\n".join(re.sub(r"//.*", "", line) for line in text.splitlines())
    types: dict[str, dict[str, bool]] = {}
    for m in re.finditer(r"export type (\w+) = \{", src):
        start = m.end() - 1
        depth = 0
        end = start
        for i in range(start, len(src)):
            if src[i] == "{":
                depth += 1
            elif src[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        body = src[start + 1 : end]
        # 深さ0の「;」「改行」で文に区切る（1行に複数フィールドが並ぶ型に対応）
        fields: dict[str, bool] = {}
        depth = 0
        statement = ""
        for ch in body + "\n":
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            if depth == 0 and ch in ";\n":
                fm = _FIELD_RE.match(statement)
                if fm:
                    fields[fm.group(1)] = fm.group(2) == "?"
                statement = ""
            else:
                statement += ch
        types[m.group(1)] = fields
    return types


def check_drift() -> int:
    ts_types = _parse_ts_types(LIB_TYPES_TS.read_text(encoding="utf-8"))
    problems: list[str] = []
    for type_name, model in TS_TYPE_TO_MODEL.items():
        ts_fields = ts_types.get(type_name)
        if ts_fields is None:
            problems.append(f"{type_name}: lib/types.ts に export type が見つからない")
            continue
        model_fields = model.model_fields
        for name, optional in ts_fields.items():
            if name in INTENTIONALLY_OMITTED:
                if name in model_fields:
                    problems.append(f"{type_name}.{name}: 意図的除外リストにあるのにモデルに存在する")
                elif not optional:
                    problems.append(
                        f"{type_name}.{name}: TS側で必須化された（Phase 1 の意図的除外と矛盾。"
                        "モデルへの追加と 09 §2 の見直しが必要）"
                    )
                continue
            if name not in model_fields:
                problems.append(f"{type_name}.{name}: pydanticモデルに存在しない")
                continue
            required = model_fields[name].is_required()
            if optional == required:
                problems.append(
                    f"{type_name}.{name}: optionalフラグ不一致（TS: {'?' if optional else '必須'} / "
                    f"pydantic: {'必須' if required else '任意'}）"
                )
        for name in model_fields:
            if name not in ts_fields:
                problems.append(f"{type_name}.{name}: lib/types.ts に存在しない")
    if problems:
        print("check-drift: lib/types.ts と pydantic モデルに差分がある")
        for p in problems:
            print(f"  {p}")
        return 1
    print(f"check-drift: OK（{len(TS_TYPE_TO_MODEL)}型を照合）")
    return 0


# ---------------------------------------------------------------------------
# B〜F の個別チェック
# ---------------------------------------------------------------------------


def _load_master() -> dict[str, dict]:
    return {c["id"]: c for c in json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))}


def _load_glossary_slugs() -> set[str]:
    return {g["slug"] for g in json.loads(GLOSSARY_JSON.read_text(encoding="utf-8"))}


def _check_champion(
    master: dict[str, dict], champ_id: str, role: str, where: str, errors: list[str]
) -> None:
    entry = master.get(champ_id)
    if entry is None:
        errors.append(f"{where}: champion「{champ_id}」が champions.json に存在しない")
        return
    if role not in entry["lanes"]:
        errors.append(f"{where}: 「{champ_id}」の lanes {entry['lanes']} に {role} がない")


def _enemy_skill_table(r: Resolvers, master: dict, enemy_ids: list[str]) -> dict[str, dict]:
    """敵チャンピオンの (slot, name, icon) 一覧。icon → {champion, slot, name}"""
    table: dict[str, dict] = {}
    for champ_id in enemy_ids:
        ja = master[champ_id]["name"]["ja"]
        for slot in "PQWER":
            w: list[str] = []
            got = r.resolve_skill(ja, slot, w)
            table[got["icon"]] = {"champion": champ_id, "slot": slot, "name": got["name"]}
    return table


def _check_advice_refs(
    r: Resolvers,
    master: dict,
    glossary_slugs: set[str],
    advice: dict,
    enemy_ids: list[str],
    where: str,
    errors: list[str],
) -> None:
    """B. 参照整合（1視点分）。"""
    known = {e for e in enemy_ids if e in master}
    if len(known) == len(enemy_ids):
        table = _enemy_skill_table(r, master, enemy_ids)
        for i, ds in enumerate(advice["dangerSkills"]):
            hit = table.get(ds["icon"])
            if hit is None:
                errors.append(
                    f"{where}.dangerSkills[{i}]: icon「{ds['icon']}」は敵（{'/'.join(enemy_ids)}）"
                    "のスキル画像ではない"
                )
                continue
            if hit["slot"] != ds["slot"]:
                errors.append(
                    f"{where}.dangerSkills[{i}]: icon「{ds['icon']}」は {hit['slot']} のスキル"
                    f"（slot は {ds['slot']}）"
                )
            if hit["name"] != ds["name"]:
                errors.append(
                    f"{where}.dangerSkills[{i}]: name「{ds['name']}」が正式名"
                    f"「{hit['name']}」と一致しない"
                )

    items_raw = ddragon.load_items()
    rec = advice["recommended"]
    build = rec["build"]
    for label, it in [
        *((f"core[{i}]", x) for i, x in enumerate(build["core"])),
        ("boots", build["boots"]),
        *((f"situational[{i}]", s["item"]) for i, s in enumerate(build["situational"])),
    ]:
        entry = items_raw.get(str(it["id"]))
        if entry is None:
            errors.append(f"{where}.{label}: アイテムID {it['id']} が item.json に存在しない")
            continue
        if entry["name"] != it["name"]:
            errors.append(
                f"{where}.{label}: name「{it['name']}」が正式名「{entry['name']}」と一致しない"
            )
        if label == "boots" and "Boots" not in entry.get("tags", []):
            errors.append(f"{where}.boots: 「{it['name']}」に Boots タグがない")

    summoners = ddragon.load_summoners()
    valid_spell_ids = {sp["id"] for sp in summoners.values()}
    for spell_id in rec["spells"]:
        if spell_id not in valid_spell_ids:
            errors.append(f"{where}: スペル「{spell_id}」が summoner.json に存在しない")

    runes = rec["runes"]
    try:
        w: list[str] = []
        got = r.resolve_runes(runes["keystone"], runes["primary"], runes["secondary"], w)
        if got != runes:
            errors.append(f"{where}.runes: {runes} が正式値 {got} と一致しない")
    except Exception as e:  # ResolveError 含む
        errors.append(f"{where}.runes: {e}")

    refs = advice["glossaryRefs"]
    if len(refs) != len(set(refs)):
        errors.append(f"{where}.glossaryRefs: 重複がある {refs}")
    for slug in refs:
        if slug not in glossary_slugs:
            errors.append(f"{where}.glossaryRefs: 「{slug}」が glossary.json に存在しない")


def _prose_fields(obj: dict, is_bot: bool) -> list[tuple[str, str]]:
    """D検査の対象（LLMが書く文章フィールド）を (場所, 文字列) で列挙する。"""

    def advice_fields(a: dict, prefix: str) -> list[tuple[str, str]]:
        out = [(f"{prefix}summary", a["summary"])]
        if "gamePlan" in a:
            out += [(f"{prefix}gamePlan.{k}", v) for k, v in a["gamePlan"].items()]
        for i, ds in enumerate(a["dangerSkills"]):
            out.append((f"{prefix}dangerSkills[{i}].tag", ds["tag"]))
            out.append((f"{prefix}dangerSkills[{i}].description", ds["description"]))
        out.append((f"{prefix}powerSpike.note", a["powerSpike"]["note"]))
        for i, s in enumerate(a["recommended"]["build"]["situational"]):
            out.append((f"{prefix}situational[{i}].reason", s["reason"]))
        return out

    if is_bot:
        return advice_fields(obj["views"]["adc"], "adc.") + advice_fields(
            obj["views"]["sup"], "sup."
        )
    return advice_fields(obj, "")


def _check_style(obj: dict, is_bot: bool, errors: list[str]) -> None:
    """D. 表記。"""
    for where, text in _prose_fields(obj, is_bot):
        if _STATS_RE.search(text):
            errors.append(f"{where}: 統計語（勝率/ピック率）が混入している: 「{text}」")
        if _ASSERTIVE_RE.search(text):
            errors.append(f"{where}: 断定表現（必ず/確実に/絶対に）がある: 「{text}」")
        if _FULLWIDTH_DIGIT_RE.search(text):
            errors.append(f"{where}: 全角数字がある: 「{text}」")
        if _DESUMASU_RE.search(text):
            errors.append(f"{where}: 敬体（です・ます）がある。常体で書く: 「{text}」")


def _iter_strings(value: Any, path: str = "$"):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, dict):
        for k, v in value.items():
            yield from _iter_strings(v, f"{path}.{k}")
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from _iter_strings(v, f"{path}[{i}]")


def _check_normalization(text: str, obj: dict, errors: list[str]) -> None:
    """F. 正規化。改行はLFに正規化してから比較する（CRLF作業ツリー対策）。"""
    for path, s in _iter_strings(obj):
        if unicodedata.normalize("NFC", s) != s:
            errors.append(f"{path}: Unicode NFC でない")
        if s != s.strip():
            errors.append(f"{path}: 前後に空白がある: {s!r}")
    canonical = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    if text.replace("\r\n", "\n") != canonical:
        errors.append(
            "書式が json.dump(indent=2, ensure_ascii=False) + 末尾改行1つ と一致しない（03 §7）"
        )


def _check_file_identity(path: Path, obj: dict, errors: list[str]) -> None:
    """E. ファイルパスとJSON内容の自己整合。"""
    lane_dir = path.parent.name
    stem = path.stem
    if lane_dir == "bot":
        ids = [obj.get("myAdc"), obj.get("mySup"), obj.get("enemyAdc"), obj.get("enemySup")]
        if not all(isinstance(x, str) and SLUG_RE.match(x) for x in ids):
            errors.append(f"champion id が slug 規約（{SLUG_RE.pattern}）を満たさない: {ids}")
            return
        expected = f"{ids[0]}-{ids[1]}-vs-{ids[2]}-{ids[3]}"
        if stem != expected:
            errors.append(f"ファイル名「{stem}」が内容から導かれる「{expected}」と一致しない")
        if len(set(ids)) != 4:
            errors.append(f"同一チャンピオンが重複している: {ids}")
    elif lane_dir in LANES:
        me, enemy = obj.get("me"), obj.get("enemy")
        if obj.get("lane") != lane_dir:
            errors.append(f"lane「{obj.get('lane')}」がディレクトリ「{lane_dir}」と一致しない")
        if not all(isinstance(x, str) and SLUG_RE.match(x) for x in (me, enemy)):
            errors.append(f"champion id が slug 規約を満たさない: {me}, {enemy}")
            return
        if stem != f"{me}-vs-{enemy}":
            errors.append(f"ファイル名「{stem}」が「{me}-vs-{enemy}」と一致しない")
        if me == enemy:
            errors.append(f"me と enemy が同一: {me}")
    else:
        errors.append(f"未知のレーンディレクトリ: {lane_dir}")


def validate_file(path: Path, r: Resolvers, master: dict, glossary_slugs: set[str]) -> list[str]:
    """1ファイル分の A〜F。エラーメッセージのリストを返す（空なら合格）。"""
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    try:
        obj = json.loads(text)
    except json.JSONDecodeError as e:
        return [f"JSONとして読めない: {e}"]

    is_bot = path.parent.name == "bot"

    # E. ファイル自己整合
    _check_file_identity(path, obj, errors)

    # A + C. 構造・文字数（pydantic 最終モデル）
    model = BotMatchup if is_bot else LaneMatchup
    try:
        model.model_validate(obj)
    except ValidationError as e:
        for err in e.errors():
            loc = ".".join(str(x) for x in err["loc"])
            errors.append(f"{loc}: {err['msg']}")
        return errors  # 形が壊れていたら B/D/F はスキップ

    # B. 参照整合
    if is_bot:
        for role, key in [("adc", "myAdc"), ("sup", "mySup"), ("adc", "enemyAdc"), ("sup", "enemySup")]:
            _check_champion(master, obj[key], role, key, errors)
        enemies = [obj["enemyAdc"], obj["enemySup"]]
        _check_advice_refs(r, master, glossary_slugs, obj["views"]["adc"], enemies, "adc", errors)
        _check_advice_refs(r, master, glossary_slugs, obj["views"]["sup"], enemies, "sup", errors)
    else:
        _check_champion(master, obj["me"], obj["lane"], "me", errors)
        _check_champion(master, obj["enemy"], obj["lane"], "enemy", errors)
        _check_advice_refs(r, master, glossary_slugs, obj, [obj["enemy"]], "", errors)

    # D. 表記
    _check_style(obj, is_bot, errors)

    # F. 正規化
    _check_normalization(text, obj, errors)

    return errors


# ---------------------------------------------------------------------------
# CLI エントリ
# ---------------------------------------------------------------------------


def _run(paths: list[Path]) -> int:
    if check_drift() != 0:
        return 1
    r = Resolvers()
    master = _load_master()
    glossary_slugs = _load_glossary_slugs()
    total = 0
    for path in paths:
        where = f"{path.parent.name}/{path.stem}"
        errors = validate_file(path, r, master, glossary_slugs)
        if errors:
            total += len(errors)
            print(f"NG   {where}")
            for e in errors:
                print(f"     {e}")
        else:
            print(f"OK   {where}")
    if total:
        print(f"\n検証エラー {total}件")
        return 1
    print(f"\n全{len(paths)}件パス")
    return 0


def run_all() -> int:
    paths = sorted(MATCHUPS_DIR.rglob("*.json"))
    if not paths:
        print("data/matchups/ にファイルがない")
        return 1
    return _run(paths)


def run_one(matchup_id: str) -> int:
    lane, _, slug = matchup_id.partition("/")
    path = MATCHUPS_DIR / lane / f"{slug}.json"
    if not path.exists():
        print(f"エラー: {path} が存在しない")
        return 1
    return _run([path])
