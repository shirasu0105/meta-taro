"""名前解決（docs/09_data_pipeline.md §3.2）。

LLMが出力した人間可読な日本語名を、Data Dragon の正規ID・画像ファイル名へ変換する。

解決アルゴリズム（各解決器で共通）:
1. 完全一致（NFKC正規化 + 空白・中黒除去 + 長音記号の異体統一 + casefold）
2. 別名表 scripts/aliases.json
3. 曖昧一致 difflib.get_close_matches(cutoff=0.92)。候補が唯一のときのみ採用し warning に記録
4. 失敗 → ResolveError（呼び出し側が対面全体を invalid にする）
"""

from __future__ import annotations

import difflib
import json
import re
import unicodedata
from typing import Any

from . import ddragon
from .config import ALIASES_JSON, CHAMPIONS_JSON, GLOSSARY_JSON

FUZZY_CUTOFF = 0.92

# 長音記号として使われがちな異体（ハイフン・ダッシュ類）を ー に統一する
_CHOON_VARIANTS = re.compile(r"[‐‑‒–—―−－-]")
_STRIP_CHARS = re.compile(r"[\s・]")


class ResolveError(Exception):
    """解決失敗。メッセージは queue の notes にそのまま記録される。"""


def normalize(name: str) -> str:
    s = unicodedata.normalize("NFKC", name)
    s = _CHOON_VARIANTS.sub("ー", s)
    s = _STRIP_CHARS.sub("", s)
    return s.casefold()


class _Dictionary:
    """正規化名 → 値 の辞書1つ分。構築時に正規化名の衝突を検出する。"""

    def __init__(self, kind: str, entries: dict[str, Any], aliases: dict[str, str]):
        self.kind = kind
        self.by_norm: dict[str, Any] = {}
        self.display: dict[str, str] = {}  # 正規化名 → 元の表示名（エラー表示用）
        for name, value in entries.items():
            key = normalize(name)
            if key in self.by_norm and self.by_norm[key] != value:
                raise RuntimeError(
                    f"{kind}辞書の構築で正規化名が衝突: 「{self.display[key]}」と「{name}」"
                )
            self.by_norm[key] = value
            self.display[key] = name
        self.aliases = {normalize(a): official for a, official in aliases.items()}

    def lookup(self, name: str, warnings: list[str]) -> Any:
        key = normalize(name)
        if key in self.by_norm:
            return self.by_norm[key]
        if key in self.aliases:
            official = self.aliases[key]
            okey = normalize(official)
            if okey not in self.by_norm:
                raise ResolveError(
                    f"{self.kind}: aliases.json の「{name}」→「{official}」が辞書に存在しない"
                )
            warnings.append(f"resolved_by=alias: \"{name}\"→\"{official}\"")
            return self.by_norm[okey]
        candidates = difflib.get_close_matches(key, self.by_norm.keys(), n=2, cutoff=FUZZY_CUTOFF)
        if len(candidates) == 1:
            hit = candidates[0]
            warnings.append(f"resolved_by=fuzzy: \"{name}\"→\"{self.display[hit]}\"")
            return self.by_norm[hit]
        if len(candidates) > 1:
            names = " / ".join(self.display[c] for c in candidates)
            raise ResolveError(f"{self.kind}「{name}」が曖昧（候補: {names}）")
        raise ResolveError(f"{self.kind}「{name}」を解決できない（aliases.json への追加を検討）")


def _load_aliases() -> dict[str, dict[str, str]]:
    return json.loads(ALIASES_JSON.read_text(encoding="utf-8"))


class Resolvers:
    """5解決器。Data Dragon キャッシュと aliases.json から構築する。"""

    def __init__(self) -> None:
        aliases = _load_aliases()

        # 1. アイテム: 日本語名 → (数値ID, 正式名)。SRで購入可能なものに絞る（09 §3.2）
        items = ddragon.load_items()
        item_entries: dict[str, tuple[int, str]] = {}
        for item_id, it in items.items():
            if not it.get("maps", {}).get("11"):
                continue
            if not it.get("gold", {}).get("purchasable"):
                continue
            if it.get("requiredAlly"):
                continue
            item_entries[it["name"]] = (int(item_id), it["name"])
        self.items = _Dictionary("アイテム", item_entries, aliases.get("item", {}))
        self._item_data = items

        # 2. サモナースペル: 日本語名 → DD表記ID（例 "SummonerFlash"）。CLASSICモードのみ
        spells = ddragon.load_summoners()
        spell_entries = {
            sp["name"]: sp["id"] for sp in spells.values() if "CLASSIC" in sp.get("modes", [])
        }
        self.spells = _Dictionary("サモナースペル", spell_entries, aliases.get("spell", {}))

        # 3. スキル: (チャンピオン日本語名, スロット) → (正式スキル名, 画像ファイル名)
        champs = ddragon.load_champion_full()
        champ_entries = {c["name"]: key for key, c in champs.items()}
        self.champions = _Dictionary("チャンピオン", champ_entries, aliases.get("champion", {}))
        self._champion_data = champs

        # 4. ルーン: キーストーン名 → (正式名, iconパス, 所属ツリー名)。ツリー名 → 正式名
        runes = ddragon.load_runes()
        keystone_entries: dict[str, tuple[str, str, str]] = {}
        tree_entries: dict[str, str] = {}
        for tree in runes:
            tree_entries[tree["name"]] = tree["name"]
            for rune in tree["slots"][0]["runes"]:
                keystone_entries[rune["name"]] = (rune["name"], rune["icon"], tree["name"])
        self.keystones = _Dictionary("キーストーン", keystone_entries, aliases.get("keystone", {}))
        self.trees = _Dictionary("ルーンツリー", tree_entries, aliases.get("tree", {}))

        # 5. 用語: 日本語の用語 → slug。完全一致のみ（曖昧一致・別名表を使わない）
        glossary = json.loads(GLOSSARY_JSON.read_text(encoding="utf-8"))
        self._terms = {normalize(g["term"]): g["slug"] for g in glossary}
        self._term_display = {g["slug"]: g["term"] for g in glossary}

        # champions.json（アプリ側マスタ）: id → 日本語名（check-mocks 用の逆引き）
        master = json.loads(CHAMPIONS_JSON.read_text(encoding="utf-8"))
        self.master_ja_by_id = {c["id"]: c["name"]["ja"] for c in master}

    # -- アイテム ------------------------------------------------------------

    def resolve_item(self, name: str, warnings: list[str]) -> dict[str, Any]:
        item_id, official = self.items.lookup(name, warnings)
        return {"id": item_id, "name": official}

    def item_tags(self, item_id: int) -> list[str]:
        return self._item_data.get(str(item_id), {}).get("tags", [])

    # -- サモナースペル -------------------------------------------------------

    def resolve_spell(self, name: str, warnings: list[str]) -> str:
        return self.spells.lookup(name, warnings)

    # -- スキル ---------------------------------------------------------------

    def resolve_skill(self, champion_ja: str, slot: str, warnings: list[str]) -> dict[str, str]:
        ddragon_id = self.champions.lookup(champion_ja, warnings)
        champ = self._champion_data[ddragon_id]
        if slot == "P":
            # UIの spellIconUrl は /img/spell/ 固定でパッシブ画像を表示できない。
            # 解決はするが warning でレビューに出す。
            warnings.append(f"passive_skill: {champion_ja} のPはUIで画像表示できない")
            p = champ["passive"]
            return {"name": p["name"], "icon": p["image"]["full"]}
        index = "QWER".index(slot)
        spell = champ["spells"][index]
        return {"name": spell["name"], "icon": spell["image"]["full"]}

    # -- ルーン ---------------------------------------------------------------

    def resolve_runes(
        self, keystone: str, primary: str, secondary: str, warnings: list[str]
    ) -> dict[str, str]:
        official, icon, home_tree = self.keystones.lookup(keystone, warnings)
        primary_official = self.trees.lookup(primary, warnings)
        secondary_official = self.trees.lookup(secondary, warnings)
        if primary_official == secondary_official:
            raise ResolveError(f"ルーン: primary と secondary が同一（{primary_official}）")
        if home_tree != primary_official:
            raise ResolveError(
                f"ルーン: キーストーン「{official}」は「{home_tree}」のルーン"
                f"（primary は「{primary_official}」）"
            )
        return {
            "keystone": official,
            "primary": primary_official,
            "secondary": secondary_official,
            "icon": icon,
        }

    # -- 用語 -----------------------------------------------------------------

    def resolve_terms(self, terms: list[str], warnings: list[str]) -> list[str]:
        slugs: list[str] = []
        for term in terms:
            slug = self._terms.get(normalize(term))
            if slug is None:
                # 用語チップは装飾要素。未収載は落として warning（09 §3.2）
                warnings.append(f"glossary未収載を除外: \"{term}\"")
                continue
            if slug not in slugs:
                slugs.append(slug)
        return slugs

    def term_of_slug(self, slug: str) -> str | None:
        return self._term_display.get(slug)


# ---------------------------------------------------------------------------
# check-mocks: data/matchups/ 全件の識別子を人間可読名から復元して照合（T-704 完了条件）
# ---------------------------------------------------------------------------


def _champion_ja_from_icon(r: Resolvers, icon: str, candidates: list[str]) -> str | None:
    """アイコンのファイル名から、候補（敵チャンピオンid）のどちらのスキルかを特定する。"""
    for champ_id in candidates:
        ja = r.master_ja_by_id[champ_id]
        for slot in "QWER":
            w: list[str] = []
            if r.resolve_skill(ja, slot, w)["icon"] == icon:
                return ja
    return None


def _check_advice(r: Resolvers, advice: dict, enemies: list[str], where: str) -> list[str]:
    problems: list[str] = []
    w: list[str] = []

    for i, ds in enumerate(advice["dangerSkills"]):
        ja = _champion_ja_from_icon(r, ds["icon"], enemies)
        if ja is None:
            problems.append(f"{where}.dangerSkills[{i}]: icon {ds['icon']} が敵スキルに見つからない")
            continue
        got = r.resolve_skill(ja, ds["slot"], w)
        if got["name"] != ds["name"] or got["icon"] != ds["icon"]:
            problems.append(
                f"{where}.dangerSkills[{i}]: ({ja}, {ds['slot']}) → "
                f"name={got['name']} icon={got['icon']} / モックは name={ds['name']} icon={ds['icon']}"
            )

    rec = advice["recommended"]
    all_items = [*rec["build"]["core"], rec["build"]["boots"], *(s["item"] for s in rec["build"]["situational"])]
    for it in all_items:
        try:
            got_item = r.resolve_item(it["name"], w)
        except ResolveError as e:
            problems.append(f"{where}: {e}")
            continue
        if got_item != it:
            problems.append(
                f"{where}: アイテム「{it['name']}」→ {got_item} / モックは {it}"
            )

    for spell_id in rec["spells"]:
        spell_ja = next(
            (sp["name"] for sp in ddragon.load_summoners().values() if sp["id"] == spell_id), None
        )
        if spell_ja is None:
            problems.append(f"{where}: スペルID {spell_id} が summoner.json にない")
            continue
        try:
            got_id = r.resolve_spell(spell_ja, w)
            if got_id != spell_id:
                problems.append(f"{where}: スペル「{spell_ja}」→ {got_id} / モックは {spell_id}")
        except ResolveError as e:
            problems.append(f"{where}: {e}")

    runes = rec["runes"]
    try:
        got_runes = r.resolve_runes(runes["keystone"], runes["primary"], runes["secondary"], w)
        if got_runes != runes:
            problems.append(f"{where}: ルーン → {got_runes} / モックは {runes}")
    except ResolveError as e:
        problems.append(f"{where}: {e}")

    terms = [r.term_of_slug(s) for s in advice["glossaryRefs"]]
    if None in terms:
        problems.append(f"{where}: glossaryRefs に glossary.json 未収載の slug がある")
    else:
        got_slugs = r.resolve_terms([t for t in terms if t], w)
        if got_slugs != advice["glossaryRefs"]:
            problems.append(f"{where}: 用語 → {got_slugs} / モックは {advice['glossaryRefs']}")

    for warning in w:
        problems.append(f"{where}: [warning] {warning}")
    return problems


def check_mocks() -> int:
    from .config import MATCHUPS_DIR

    r = Resolvers()
    total_problems = 0
    for path in sorted(MATCHUPS_DIR.rglob("*.json")):
        obj = json.loads(path.read_text(encoding="utf-8"))
        where = f"{path.parent.name}/{path.stem}"
        problems = _check_advice(r, obj, [obj["enemy"]], where)
        if problems:
            total_problems += len(problems)
            print(f"NG   {where}")
            for p in problems:
                print(f"     {p}")
        else:
            print(f"OK   {where}")
    if total_problems:
        print(f"\n{total_problems}件の不一致。aliases.json への追加かモックの正式名化が必要")
        return 1
    print("\n全識別子が人間可読名から復元できた")
    return 0
