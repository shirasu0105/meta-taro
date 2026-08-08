"use client";

import { useState } from "react";
import { BotSearchForm } from "./BotSearchForm";
import { LaneSearchForm } from "./LaneSearchForm";

const TABS = [
  { key: "lane", label: "通常レーン" },
  { key: "bot", label: "BOT（2v2）" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * 検索タブ（06_ui §4.2 / §6）。クライアント状態のみ・リロードで既定=通常レーン。
 * 両フォームをマウントしたまま hidden 切替し、タブ往復で選択状態を保持する。
 */
export function SearchTabs() {
  const [tab, setTab] = useState<TabKey>("lane");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex border-b border-border-subtle" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex-1 border-b-2 pb-3 pt-[13px] text-[13px] font-extrabold md:w-[220px] md:flex-none md:text-[14px] ${
              tab === t.key
                ? "border-gold text-gold"
                : "border-transparent text-text-muted hover:text-text-hi"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div hidden={tab !== "lane"}>
        <LaneSearchForm />
      </div>
      <div hidden={tab !== "bot"}>
        <BotSearchForm />
      </div>
    </div>
  );
}
