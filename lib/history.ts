// 検索履歴（localStorage・直近10件）のクライアント用ユーティリティ（04_api §2 / 06_ui §6）。
// チャンピオン名は保存せず id のみ持つ。表示時に getChampion で解決する。

import { buildBotSlug, buildLaneSlug, isChampionSlug } from "@/lib/slug";
import type { Lane } from "@/lib/types";

const STORAGE_KEY = "metataro:search-history:v1";
const LIMIT = 10;
const LANES: readonly Lane[] = ["top", "jg", "mid"];

export type HistoryEntry =
  | { kind: "lane"; lane: Lane; me: string; enemy: string }
  | { kind: "bot"; myAdc: string; mySup: string; enemyAdc: string; enemySup: string };

/** 結果ページのURL。重複判定キーも兼ねる */
export function entryHref(entry: HistoryEntry): string {
  return entry.kind === "lane"
    ? `/matchups/${entry.lane}/${buildLaneSlug(entry.me, entry.enemy)}`
    : `/matchups/bot/${buildBotSlug(entry.myAdc, entry.mySup, entry.enemyAdc, entry.enemySup)}`;
}

/** 保存済みデータの検証。古い・壊れたエントリで画面を落とさない */
function isValidEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  if (e.kind === "lane") {
    return (
      LANES.includes(e.lane as Lane) &&
      typeof e.me === "string" &&
      typeof e.enemy === "string" &&
      isChampionSlug(e.me) &&
      isChampionSlug(e.enemy)
    );
  }
  if (e.kind === "bot") {
    const ids = [e.myAdc, e.mySup, e.enemyAdc, e.enemySup];
    return ids.every((id) => typeof id === "string" && isChampionSlug(id));
  }
  return false;
}

/** 新しい順。SSR・パース失敗・スキーマ不正はすべて空配列 */
function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isValidEntry).slice(0, LIMIT);
  } catch {
    return EMPTY;
  }
}

/** 重複は先頭へ寄せ、直近10件だけ残す（06_ui §6） */
export function pushHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const href = entryHref(entry);
  const next = [entry, ...readHistory().filter((e) => entryHref(e) !== href)].slice(0, LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // プライベートモード等で保存できなくても履歴は補助機能なので無視する
  }
  for (const listener of listeners) listener();
}

// --- 外部ストアとしての購読（useSyncExternalStore 用） ---
// localStorage は React の管理外なので、スナップショットを同一参照で返せるようキャッシュする。

const EMPTY: HistoryEntry[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: HistoryEntry[] } = { raw: null, value: EMPTY };

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  // 別タブでの更新にも追従する（同一タブでは storage イベントが発火しないため pushHistory 側で通知）
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** 保存内容が変わらない限り同じ配列参照を返す（無限再描画の回避） */
export function getHistorySnapshot(): HistoryEntry[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cache.raw) cache = { raw, value: readHistory() };
  return cache.value;
}

/** サーバー描画時は常に空（localStorage が無いため） */
export function getHistoryServerSnapshot(): HistoryEntry[] {
  return EMPTY;
}

/** 履歴の「自分側」チャンピオンを出現回数の多い順に返す（06_ui §4.2「よく使う」） */
export function frequentChampionIds(entries: HistoryEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const ids = entry.kind === "lane" ? [entry.me] : [entry.myAdc, entry.mySup];
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
