// チャンピオン検索。純粋関数のためサーバー・クライアント両方で使える。
import { getChampions } from "@/lib/champions";
import type { Champion } from "@/lib/types";

/**
 * ひらがな・カタカナ・英語の部分一致検索。
 * search[] にひらがな・カタカナ両表記を持たせているため、かな変換は行わない。
 * lane を指定すると適性レーンで絞り込む。
 */
export function searchChampions(query: string, lane?: string): Champion[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [];
  return getChampions().filter((c) => {
    if (lane && !c.lanes.includes(lane as Champion["lanes"][number])) return false;
    return (
      c.name.ja.includes(q) ||
      c.name.en.toLowerCase().includes(q) ||
      c.search.some((term) => term.toLowerCase().includes(q))
    );
  });
}
