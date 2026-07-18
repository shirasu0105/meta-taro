"use client";

import Image from "next/image";
import { useState } from "react";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { championIconUrl } from "@/lib/ddragon";
import type { Champion } from "@/lib/types";
import { ChampionPicker } from "./ChampionPicker";

/** BOTタブのチャンピオンスロット。未選択=破線枠 → クリックでインライン入力（06_ui §4.2） */
export function BotSlot({
  role,
  tone,
  lane,
  selected,
  onSelect,
  excludeIds,
}: {
  role: "ADC" | "SUP";
  tone: "ally" | "enemy";
  lane: "adc" | "sup";
  selected: Champion | null;
  onSelect: (champion: Champion | null) => void;
  excludeIds?: string[];
}) {
  const [editing, setEditing] = useState(false);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-[2px] border border-border bg-bg p-2.5">
        <RoleBadge tone={tone}>{role}</RoleBadge>
        <Image
          src={championIconUrl(selected.ddragonId)}
          alt={selected.name.ja}
          width={28}
          height={28}
          className="rounded-[2px] bg-icon-bg"
        />
        <span className="truncate text-[12px] font-bold text-text-hi md:text-[12.5px]">
          {selected.name.ja}
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setEditing(false);
          }}
          aria-label={`${selected.name.ja}の選択を解除`}
          className="ml-auto text-[14px] text-text-faint hover:text-text-hi"
        >
          ×
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-[2px] border border-border bg-bg p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <RoleBadge tone={tone}>{role}</RoleBadge>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label={`${role}の入力をやめる`}
            className="px-1 text-[12px] text-text-faint hover:text-text-hi"
          >
            ×
          </button>
        </div>
        <ChampionPicker
          lane={lane}
          selected={null}
          onSelect={(c) => {
            onSelect(c);
            setEditing(false);
          }}
          excludeIds={excludeIds}
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center justify-center gap-[7px] rounded-[2px] border border-dashed border-star-off p-3 hover:border-border"
    >
      <span className="whitespace-nowrap rounded-[2px] border border-star-off px-[5px] py-px text-[9px] font-extrabold text-[#8B95A7]">
        {role}
      </span>
      <span className="text-[11.5px] text-[#8B95A7] md:text-[12px]">＋ クリックして選択</span>
    </button>
  );
}
