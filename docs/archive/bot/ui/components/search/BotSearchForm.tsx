"use client";

import { useState } from "react";
import { buildBotSlug } from "@/lib/slug";
import type { Champion } from "@/lib/types";
import { BotProgressBar } from "./BotProgressBar";
import { BotSlot } from "./BotSlot";
import { RecentSearches } from "./RecentSearches";
import { SearchSubmit } from "./SearchSubmit";

type SlotKey = "myAdc" | "mySup" | "enemyAdc" | "enemySup";

const SLOT_LABELS: Record<SlotKey, string> = {
  myAdc: "自ADC",
  mySup: "自SUP",
  enemyAdc: "敵ADC",
  enemySup: "敵SUP",
};

type Slots = Record<SlotKey, Champion | null>;

/** BOT（2v2）タブ: 自チーム/敵チーム × ADC/SUP の4スロット。4体確定まで実行不可（06_ui §4.2） */
export function BotSearchForm() {
  const [slots, setSlots] = useState<Slots>({
    myAdc: null,
    mySup: null,
    enemyAdc: null,
    enemySup: null,
  });

  const setSlot = (key: SlotKey) => (champion: Champion | null) =>
    setSlots((prev) => ({ ...prev, [key]: champion }));

  const selectedIds = Object.values(slots)
    .filter((c): c is Champion => c !== null)
    .map((c) => c.id);
  const excludeFor = (key: SlotKey) =>
    selectedIds.filter((id) => id !== slots[key]?.id);

  const missing = (Object.keys(SLOT_LABELS) as SlotKey[]).filter((key) => !slots[key]);
  const href =
    missing.length === 0
      ? `/matchups/bot/${buildBotSlug(slots.myAdc!.id, slots.mySup!.id, slots.enemyAdc!.id, slots.enemySup!.id)}`
      : null;

  const teams: { title: string; tone: "ally" | "enemy"; adc: SlotKey; sup: SlotKey }[] = [
    { title: "自チーム", tone: "ally", adc: "myAdc", sup: "mySup" },
    { title: "敵チーム", tone: "enemy", adc: "enemyAdc", sup: "enemySup" },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <BotProgressBar count={4 - missing.length} />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {teams.map((team) => (
          <div
            key={team.title}
            className="flex flex-col gap-2.5 rounded-[2px] md:border md:border-border md:bg-panel md:p-[18px]"
          >
            <h2
              className={`text-[11px] font-bold md:text-[12px] ${
                team.tone === "ally" ? "text-gold" : "text-danger"
              }`}
            >
              {team.title}
            </h2>
            <div className="grid grid-cols-2 items-start gap-2 md:gap-2.5">
              {([team.adc, team.sup] as const).map((key, i) => (
                <BotSlot
                  key={key}
                  role={i === 0 ? "ADC" : "SUP"}
                  tone={team.tone}
                  lane={i === 0 ? "adc" : "sup"}
                  selected={slots[key]}
                  onSelect={setSlot(key)}
                  excludeIds={excludeFor(key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SearchSubmit
        href={href}
        enabledLabel="この対面で結果を見る"
        disabledLabel={`残り${missing.length}体（${missing.map((k) => SLOT_LABELS[k]).join("・")}）を選択してください`}
        note="該当データがない組み合わせは「データがありません」を表示"
      />
      <RecentSearches kind="bot" />
    </div>
  );
}
