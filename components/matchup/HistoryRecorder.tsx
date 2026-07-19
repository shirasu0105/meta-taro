"use client";

import { useEffect } from "react";
import { pushHistory, type HistoryEntry } from "@/lib/history";

/**
 * 結果表示時に検索履歴へ保存する（06_ui §6 / T-401）。描画なし。
 * データがある対面ページでのみマウントする（データなしの対面は履歴に残さない）。
 */
export function HistoryRecorder({ entry }: { entry: HistoryEntry }) {
  useEffect(() => {
    // 同じ対面の再保存は重複整理で先頭に寄るだけなので、再実行されても害はない
    pushHistory(entry);
  }, [entry]);

  return null;
}
