"use client";

import { useState } from "react";
import { buildLaneSlug } from "@/lib/slug";
import type { Champion, Lane } from "@/lib/types";
import { ChampionPicker } from "./ChampionPicker";
import { FrequentChampions } from "./FrequentChampions";
import { LaneSelect } from "./LaneSelect";
import { RecentSearches } from "./RecentSearches";
import { SearchSubmit } from "./SearchSubmit";

/** 通常レーンタブ: レーン選択 + 自分/相手の2ペイン。2体確定で結果へ（06_ui §4.2） */
export function LaneSearchForm() {
  const [lane, setLane] = useState<Lane>("mid");
  const [me, setMe] = useState<Champion | null>(null);
  const [enemy, setEnemy] = useState<Champion | null>(null);

  const changeLane = (next: Lane) => {
    setLane(next);
    // 新しいレーンに適性のないチャンピオンは解除する
    if (me && !me.lanes.includes(next)) setMe(null);
    if (enemy && !enemy.lanes.includes(next)) setEnemy(null);
  };

  const href = me && enemy ? `/matchups/${lane}/${buildLaneSlug(me.id, enemy.id)}` : null;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <LaneSelect value={lane} onChange={changeLane} />
      <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5">
        <div className="rounded-[2px] md:border md:border-border md:bg-panel md:p-[18px]">
          <ChampionPicker
            label="自分のチャンピオン"
            lane={lane}
            selected={me}
            onSelect={setMe}
          />
          <FrequentChampions lane={lane} onSelect={setMe} />
        </div>
        <div className="rounded-[2px] md:border md:border-border md:bg-panel md:p-[18px]">
          <ChampionPicker
            label="相手のチャンピオン"
            lane={lane}
            selected={enemy}
            onSelect={setEnemy}
          />
        </div>
      </div>
      <SearchSubmit
        href={href}
        enabledLabel="この対面で結果を見る"
        disabledLabel="この対面で結果を見る"
        note="自分と相手の2体が確定すると表示できます"
      />
      <RecentSearches kind="lane" />
    </div>
  );
}
