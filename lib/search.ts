// チャンピオン検索。純粋関数のためサーバー・クライアント両方で使える。
import { getChampions } from "@/lib/champions";
import type { Champion } from "@/lib/types";

/**
 * 検索照合用の正規化。IMEが全角英数モードのときの「ａｎｎｉｅ」や
 * 半角カナの「ｱﾆｰ」を、NFKCで通常の英数・全角カナへ畳んでから比較する。
 * NFKCはひらがな↔カタカナを変換しないが、search[] が両表記を持つため問題ない。
 */
const normalize = (s: string) => s.normalize("NFKC").toLowerCase();

/**
 * ひらがな・カタカナ・英語の部分一致検索。
 * search[] にひらがな・カタカナ両表記を持たせているため、かな変換は行わない。
 * lane を指定すると適性レーンで絞り込む。
 */
export function searchChampions(query: string, lane?: string): Champion[] {
  const q = normalize(query.trim());
  if (q === "") return [];
  return getChampions().filter((c) => {
    if (lane && !c.lanes.includes(lane as Champion["lanes"][number])) return false;
    return (
      normalize(c.name.ja).includes(q) ||
      normalize(c.name.en).includes(q) ||
      c.search.some((term) => normalize(term).includes(q))
    );
  });
}
