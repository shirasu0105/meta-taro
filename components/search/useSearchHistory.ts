"use client";

import { useSyncExternalStore } from "react";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeHistory,
  type HistoryEntry,
} from "@/lib/history";

/**
 * 検索履歴の読み出し。localStorage はサーバーに無いため、
 * サーバー描画とハイドレーションは空 → その後クライアントの値に切り替わる。
 */
export function useSearchHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribeHistory, getHistorySnapshot, getHistoryServerSnapshot);
}
