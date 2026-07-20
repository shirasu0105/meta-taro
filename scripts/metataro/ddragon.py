"""Data Dragon の取得とキャッシュ（docs/09_data_pipeline.md §3.2）。

バージョンは lib/ddragon.ts の DDRAGON_VERSION を唯一の正とする。
取得するのは ja_JP の4ファイルのみ。キャッシュは scripts/.cache/{version}/ に置く。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx

from .config import CACHE_DIR, ddragon_version

CDN = "https://ddragon.leagueoflegends.com/cdn"

# キャッシュファイル名 → CDNパス（{ver} はバージョンで置換）
FILES = {
    "championFull.json": "{ver}/data/ja_JP/championFull.json",
    "item.json": "{ver}/data/ja_JP/item.json",
    "summoner.json": "{ver}/data/ja_JP/summoner.json",
    "runesReforged.json": "{ver}/data/ja_JP/runesReforged.json",
}


def cache_dir(version: str | None = None) -> Path:
    return CACHE_DIR / (version or ddragon_version())


def sync(force: bool = False) -> int:
    version = ddragon_version()
    dest = cache_dir(version)
    dest.mkdir(parents=True, exist_ok=True)
    print(f"Data Dragon {version}（lib/ddragon.ts より） → {dest}")

    with httpx.Client(timeout=60.0, follow_redirects=True) as client:
        for name, path in FILES.items():
            target = dest / name
            if target.exists() and not force:
                print(f"  {name}: キャッシュ済み（--force で再取得）")
                continue
            url = f"{CDN}/{path.format(ver=version)}"
            resp = client.get(url)
            resp.raise_for_status()
            # JSONとして読めることを確認してから保存する（途中破損の混入防止）
            json.loads(resp.content)
            target.write_bytes(resp.content)
            print(f"  {name}: 取得 {len(resp.content):,} bytes")
    return 0


def load(name: str) -> Any:
    """キャッシュ済みJSONを読む。未取得なら ddragon sync を促してエラー。"""
    target = cache_dir() / name
    if not target.exists():
        raise SystemExit(
            f"エラー: {target} がない。先に `npm run data -- ddragon sync` を実行する"
        )
    return json.loads(target.read_text(encoding="utf-8"))


def load_champion_full() -> dict[str, Any]:
    """championFull.json の data 部（ddragonId → チャンピオン情報）。"""
    return load("championFull.json")["data"]


def load_items() -> dict[str, Any]:
    """item.json の data 部（数値ID文字列 → アイテム情報）。"""
    return load("item.json")["data"]


def load_summoners() -> dict[str, Any]:
    """summoner.json の data 部（"SummonerFlash" 等 → スペル情報）。"""
    return load("summoner.json")["data"]


def load_runes() -> list[dict[str, Any]]:
    """runesReforged.json（ツリーの配列）。"""
    return load("runesReforged.json")
