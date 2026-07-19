"use client";

import { Fragment } from "react";
import { getChampion } from "@/lib/champions";
import { frequentChampionIds } from "@/lib/history";
import type { Champion, Lane } from "@/lib/types";
import { useSearchHistory } from "./useSearchHistory";

const MAX = 3;

/**
 * 「よく使う」チャンピオン（06_ui §4.2 / T-402）。履歴の自分側から頻度上位を出す。
 * 現在のレーンで選べないチャンピオンは除く。該当が無ければ何も出さない。
 */
export function FrequentChampions({
  lane,
  onSelect,
}: {
  lane: Lane;
  onSelect: (champion: Champion) => void;
}) {
  const champions = frequentChampionIds(useSearchHistory())
    .flatMap((id) => {
      const champion = getChampion(id);
      return champion && champion.lanes.includes(lane) ? [champion] : [];
    })
    .slice(0, MAX);

  if (champions.length === 0) return null;

  return (
    <p className="mt-3 text-[10.5px] text-text-faint">
      よく使う:{" "}
      {champions.map((champion, i) => (
        <Fragment key={champion.id}>
          {i > 0 && " · "}
          <button
            type="button"
            onClick={() => onSelect(champion)}
            className="text-teal hover:underline"
          >
            {champion.name.ja}
          </button>
        </Fragment>
      ))}
    </p>
  );
}
