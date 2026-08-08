"""pydantic モデル（docs/09_data_pipeline.md §3.2 / §3.3 / §4-A）。

2段構成:
- LLM出力モデル（*LLMOutput）: 識別子を含まない。日本語名だけを受け取る
- 最終モデル（LaneMatchup）: lib/types.ts §3 を写したもの。data/ に書かれる形

BOT（2v2）のモデル（BotMatchup / BotViewAdvice / BotViews / BotAdcLLMOutput / BotSupLLMOutput）は
T-1300 で削除した。型は docs/03_database.md §3.1、復活手順は 09 §9.3。

どちらも extra="forbid"。最終モデルは `winRate` を意図的に宣言しない
（Phase 1 では混入自体をエラーにする。09 §4-A。check-drift 側の除外リストと対応）。

文字数・件数の制約（LIMITS）はプロンプトテンプレートと共有する（09 §3.3
「プロンプトとPython検証の両方に同じ数値を書く」）。
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    StringConstraints,
    field_validator,
    model_validator,
)

# ---------------------------------------------------------------------------
# 制約数値（09 §3.3。モック8件の実測値から導出）
# description の下限は §3.3 の表では 28 だが、実測 min=25（当時のBOT対面。T-1300 で退避）のため 25 に改訂。
# T-710 でドキュメント側を合わせる。
# ---------------------------------------------------------------------------

LIMITS = {
    "summary": (70, 120),
    "gamePlan": (50, 90),
    "tag": (2, 8),
    "description": (25, 70),
    "note": (25, 70),
    "reason": (3, 15),
    "dangerSkills": 3,
    "core": 3,
    "spells": 2,
    "situational": (1, 3),
    "glossary": (3, 5),
}

# aiRating ↔ advantage の整合（09 §3.3。現行8件すべてを満たす写像）
RATING_TO_ADVANTAGE = {1: "不利", 2: "不利", 3: "五分", 4: "有利", 5: "有利"}

Lane = Literal["top", "jg", "mid"]
Slot = Literal["P", "Q", "W", "E", "R"]
SpikeMark = Literal["◎", "○", "△"]
Advantage = Literal["有利", "五分", "不利"]
AiRating = Literal[1, 2, 3, 4, 5]

ChampionId = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+$")]
SummaryStr = Annotated[
    str, StringConstraints(min_length=LIMITS["summary"][0], max_length=LIMITS["summary"][1])
]
GamePlanStr = Annotated[
    str, StringConstraints(min_length=LIMITS["gamePlan"][0], max_length=LIMITS["gamePlan"][1])
]
TagStr = Annotated[
    str, StringConstraints(min_length=LIMITS["tag"][0], max_length=LIMITS["tag"][1])
]
DescriptionStr = Annotated[
    str,
    StringConstraints(min_length=LIMITS["description"][0], max_length=LIMITS["description"][1]),
]
NoteStr = Annotated[
    str, StringConstraints(min_length=LIMITS["note"][0], max_length=LIMITS["note"][1])
]
ReasonStr = Annotated[
    str, StringConstraints(min_length=LIMITS["reason"][0], max_length=LIMITS["reason"][1])
]


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _require_rating_advantage(rating: int, advantage: str, where: str) -> None:
    expected = RATING_TO_ADVANTAGE[rating]
    if advantage != expected:
        raise ValueError(
            f"{where}: aiRating={rating} なら advantage は「{expected}」（実際は「{advantage}」）"
        )


# ---------------------------------------------------------------------------
# 共通パーツ（最終モデル）
# ---------------------------------------------------------------------------


class SpikeRow(_Base):
    early: SpikeMark
    mid: SpikeMark
    late: SpikeMark


class PowerSpike(_Base):
    me: SpikeRow
    enemy: SpikeRow
    note: NoteStr


class GamePlan(_Base):
    early: GamePlanStr
    mid: GamePlanStr
    late: GamePlanStr


class DangerSkill(_Base):
    slot: Slot
    name: str
    tag: TagStr
    description: DescriptionStr
    icon: str


class Item(_Base):
    id: int
    name: str


class Runes(_Base):
    keystone: str
    primary: str
    secondary: str
    icon: str


class SituationalItem(_Base):
    item: Item
    reason: ReasonStr


class Build(_Base):
    core: list[Item]
    boots: Item
    situational: list[SituationalItem]

    @field_validator("core")
    @classmethod
    def _core_count(cls, v: list[Item]) -> list[Item]:
        if len(v) != LIMITS["core"]:
            raise ValueError(f"core はちょうど{LIMITS['core']}件（実際 {len(v)}件）")
        return v

    @field_validator("situational")
    @classmethod
    def _situational_count(cls, v: list[SituationalItem]) -> list[SituationalItem]:
        lo, hi = LIMITS["situational"]
        if not lo <= len(v) <= hi:
            raise ValueError(f"situational は{lo}〜{hi}件（実際 {len(v)}件）")
        return v


class Recommended(_Base):
    runes: Runes
    spells: list[str]
    build: Build

    @field_validator("spells")
    @classmethod
    def _spells(cls, v: list[str]) -> list[str]:
        if len(v) != LIMITS["spells"] or len(set(v)) != LIMITS["spells"]:
            raise ValueError(f"spells はちょうど{LIMITS['spells']}件・重複なし（実際 {v}）")
        return v


def _check_danger_skills(v: list) -> list:
    if len(v) != LIMITS["dangerSkills"]:
        raise ValueError(f"dangerSkills はちょうど{LIMITS['dangerSkills']}件（実際 {len(v)}件）")
    return v


def _check_glossary(v: list[str]) -> list[str]:
    lo, hi = LIMITS["glossary"]
    if not lo <= len(v) <= hi:
        raise ValueError(f"用語は{lo}〜{hi}件（実際 {len(v)}件）")
    return v


# ---------------------------------------------------------------------------
# 最終モデル（lib/types.ts §3 と同形。winRate は意図的に宣言しない）
# ---------------------------------------------------------------------------


class LaneMatchup(_Base):
    lane: Lane
    me: ChampionId
    enemy: ChampionId
    aiRating: AiRating
    advantage: Advantage
    summary: SummaryStr
    gamePlan: GamePlan
    dangerSkills: list[DangerSkill]
    powerSpike: PowerSpike
    recommended: Recommended
    glossaryRefs: list[str]

    _ds = field_validator("dangerSkills")(_check_danger_skills)
    _gl = field_validator("glossaryRefs")(_check_glossary)

    @model_validator(mode="after")
    def _cross(self) -> "LaneMatchup":
        _require_rating_advantage(self.aiRating, self.advantage, "LaneMatchup")
        return self


# check-drift（validate.py）が lib/types.ts と突き合わせる対応表。
# winRate は Phase 1 で意図的に除外している（09 §2 / §4-A）。
# BotViewAdvice / BotMatchup は T-1300 で lib/types.ts 側ごと削除したため対象外。
TS_TYPE_TO_MODEL = {
    "LaneMatchup": LaneMatchup,
    "DangerSkill": DangerSkill,
    "PowerSpike": PowerSpike,
    "Item": Item,
    "Recommended": Recommended,
}
INTENTIONALLY_OMITTED = {"winRate"}


# ---------------------------------------------------------------------------
# LLM出力モデル（09 §3.2: 識別子はLLMに書かせない）
# ---------------------------------------------------------------------------


class LLMDangerSkill(_Base):
    champion: str  # 日本語のチャンピオン名（例「アニー」）
    slot: Slot
    tag: TagStr
    description: DescriptionStr


class LLMRunes(_Base):
    keystone: str  # キーストーン名のみ。icon はPythonが解決する
    primary: str  # ツリー名（日本語。例「覇道」）
    secondary: str


class LLMSituational(_Base):
    item: str  # 日本語アイテム名
    reason: ReasonStr


class LLMBuild(_Base):
    core: list[str]  # 日本語アイテム名
    boots: str
    situational: list[LLMSituational]

    @field_validator("core")
    @classmethod
    def _core_count(cls, v: list[str]) -> list[str]:
        if len(v) != LIMITS["core"]:
            raise ValueError(f"core はちょうど{LIMITS['core']}件（実際 {len(v)}件）")
        return v

    @field_validator("situational")
    @classmethod
    def _situational_count(cls, v: list[LLMSituational]) -> list[LLMSituational]:
        lo, hi = LIMITS["situational"]
        if not lo <= len(v) <= hi:
            raise ValueError(f"situational は{lo}〜{hi}件（実際 {len(v)}件）")
        return v


class LLMRecommended(_Base):
    runes: LLMRunes
    spells: list[str]  # 日本語スペル名（例「フラッシュ」）
    build: LLMBuild

    @field_validator("spells")
    @classmethod
    def _spells(cls, v: list[str]) -> list[str]:
        if len(v) != LIMITS["spells"] or len(set(v)) != LIMITS["spells"]:
            raise ValueError(f"spells はちょうど{LIMITS['spells']}件・重複なし（実際 {v}）")
        return v


class LaneLLMOutput(_Base):
    """通常レーン1対面分。lane / me / enemy はキューCSVから注入するため含まない。"""

    aiRating: AiRating
    advantage: Advantage
    summary: SummaryStr
    gamePlan: GamePlan
    dangerSkills: list[LLMDangerSkill]
    powerSpike: PowerSpike
    recommended: LLMRecommended
    glossaryTerms: list[str]  # 日本語の用語（例「オールイン」）

    _ds = field_validator("dangerSkills")(_check_danger_skills)
    _gl = field_validator("glossaryTerms")(_check_glossary)

    @model_validator(mode="after")
    def _cross(self) -> "LaneLLMOutput":
        _require_rating_advantage(self.aiRating, self.advantage, "LLM出力")
        return self
