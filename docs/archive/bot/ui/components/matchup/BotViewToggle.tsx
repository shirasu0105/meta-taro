"use client";

import { useState } from "react";

/**
 * BOT結果の視点トグル（06_ui §4.4 / §6。既定=ADC視点）。
 * パネル群はサーバーで両視点分を描画済みの ReactNode として受け、hidden で切り替える。
 */
export function BotViewToggle({
  adcLabel,
  supLabel,
  adcContent,
  supContent,
}: {
  adcLabel: string;
  supLabel: string;
  adcContent: React.ReactNode;
  supContent: React.ReactNode;
}) {
  const [view, setView] = useState<"adc" | "sup">("adc");

  const buttonClass = (active: boolean) =>
    `rounded-[2px] border py-3 text-[13px] font-extrabold md:w-[280px] ${
      active
        ? "border-teal bg-teal/8 text-teal"
        : "border-border text-text-muted hover:text-text-hi"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <button
          type="button"
          aria-pressed={view === "adc"}
          onClick={() => setView("adc")}
          className={buttonClass(view === "adc")}
        >
          {adcLabel}
        </button>
        <button
          type="button"
          aria-pressed={view === "sup"}
          onClick={() => setView("sup")}
          className={buttonClass(view === "sup")}
        >
          {supLabel}
        </button>
        <span className="text-[10.5px] text-text-faint">
          立ち回り・注意スキル・推奨セットが視点ごとに切り替わります
        </span>
      </div>
      <div hidden={view !== "adc"}>{adcContent}</div>
      <div hidden={view !== "sup"}>{supContent}</div>
    </div>
  );
}
