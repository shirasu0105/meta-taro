"use client";

import type { Lane } from "@/lib/types";

/**
 * レーン5択（06_ui §4.2）。**`value` を持つものだけが対応レーン**で、
 * 持たないもの（JG / ADC / SUP）は「準備中」表示の `disabled` にする。
 * 押せないものを消さないのは、対応範囲を隠さず将来の拡張を示すため（06_ui §4.2）。
 * この形にすると onChange へ渡る値が型で `Lane` に絞られる。
 */
const LANE_OPTIONS: { label: string; value?: Lane }[] = [
  { label: "TOP", value: "top" },
  { label: "JG" },
  { label: "MID", value: "mid" },
  { label: "ADC" },
  { label: "SUP" },
];

/** レーン選択（06_ui §4.2。選択中=gold枠+薄gold背景 / 未対応=star-off系の淡色） */
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
      <div className="flex gap-1.5 md:gap-2.5">
        {LANE_OPTIONS.map((option) => {
          const lane = option.value;
          // 5ボタンを並べても注記が折り返さないよう、PCの固定幅は 130px から詰めている
          const base =
            "flex min-h-[40px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[2px] border text-center text-[12px] font-extrabold md:min-h-[42px] md:w-[104px] md:flex-none md:text-[13px]";
          if (lane === undefined) {
            return (
              <button
                key={option.label}
                type="button"
                disabled
                className={`${base} cursor-not-allowed border-border-subtle text-star-off`}
              >
                <span className="leading-none">{option.label}</span>
                <span className="rounded-[2px] bg-star-off/15 px-[3px] py-px text-[8px] font-bold leading-none">
                  準備中
                </span>
              </button>
            );
          }
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={value === lane}
              onClick={() => onChange(lane)}
              className={`${base} ${
                value === lane
                  ? "border-gold bg-gold/8 text-gold"
                  : "border-border text-[#8B95A7]"
              }`}
            >
              <span className="leading-none">{option.label}</span>
            </button>
          );
        })}
      </div>
      <span className="text-[9.5px] text-text-faint md:text-[10.5px]">
        JG / ADC / SUP は順次対応予定です
      </span>
    </div>
  );
}
