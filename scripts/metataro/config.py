"""パス定義と共通設定。

リポジトリルートは scripts/ の親として解決する（scripts/ はルート直下固定。02_architecture §5）。
DDRAGON_VERSION は lib/ddragon.ts を唯一の正とし、ここでは抽出のみ行う（09 §3.2）。
"""

from __future__ import annotations

import re
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = SCRIPTS_DIR.parent

DATA_DIR = REPO_ROOT / "data"
MATCHUPS_DIR = DATA_DIR / "matchups"
CHAMPIONS_JSON = DATA_DIR / "champions.json"
GLOSSARY_JSON = DATA_DIR / "glossary.json"
META_JSON = DATA_DIR / "meta.json"

LIB_DDRAGON_TS = REPO_ROOT / "lib" / "ddragon.ts"
LIB_TYPES_TS = REPO_ROOT / "lib" / "types.ts"

GENERATED_DIR = REPO_ROOT / "generated"
INBOX_DIR = GENERATED_DIR / "inbox"
REJECTED_DIR = GENERATED_DIR / "rejected"
REVIEW_DIR = GENERATED_DIR / "review"

CACHE_DIR = SCRIPTS_DIR / ".cache"
PROMPTS_DIR = SCRIPTS_DIR / "prompts"
QUEUE_CSV = SCRIPTS_DIR / "queue" / "matchups.csv"
ALIASES_JSON = SCRIPTS_DIR / "aliases.json"
CHAMPION_LANES_JSON = SCRIPTS_DIR / "champion_lanes.json"

LANES = ("top", "jg", "mid")  # jg はデータ未提供（T-1300）。bot は同タスクでスコープ外にした

_VERSION_RE = re.compile(r'DDRAGON_VERSION\s*=\s*"([^"]+)"')


def ddragon_version() -> str:
    """lib/ddragon.ts から DDRAGON_VERSION を抽出する。"""
    text = LIB_DDRAGON_TS.read_text(encoding="utf-8")
    m = _VERSION_RE.search(text)
    if not m:
        raise RuntimeError(f"DDRAGON_VERSION が {LIB_DDRAGON_TS} から抽出できない")
    return m.group(1)
