"use client";

import type { Lane } from "@/lib/types";

const LANES: { value: Lane; label: string }[] = [
  { value: "top", label: "TOP" },
  { value: "jg", label: "JG" },
  { value: "mid", label: "MID" },
];

/** レーン選択 3ボタン（06_ui §4.2。選択中=gold枠+薄gold背景） */
export function LaneSelect({
  value,
  onChange,
}: {
  value: Lane;
  onChange: (lane: Lane) => void;
}) {
  return (
    <div className="flex flex-col gap-[7px] md:flex-row md:items-center md:gap-3">
      <span className="text-[11px] text-text-muted md:w-[72px] md:text-[12px]">レーン</span>
      <div className="flex gap-2 md:gap-2.5">
        {LANES.map((lane) => (
          <button
            key={lane.value}
            type="button"
            onClick={() => onChange(lane.value)}
            className={`flex-1 rounded-[2px] border py-[11px] text-center text-[12px] font-extrabold md:w-[130px] md:flex-none md:text-[13px] ${
              value === lane.value
                ? "border-gold bg-gold/8 text-gold"
                : "border-border text-[#8B95A7]"
            }`}
          >
            {lane.label}
          </button>
        ))}
      </div>
      <span className="text-[9.5px] text-text-faint md:text-[10.5px]">
        ADC / SUP は「BOT（2v2）」タブへ
      </span>
    </div>
  );
}
