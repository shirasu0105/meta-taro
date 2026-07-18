"use client";

import Image from "next/image";
import { useState } from "react";
import { championIconUrl } from "@/lib/ddragon";
import { searchChampions } from "@/lib/search";
import type { Champion } from "@/lib/types";

/**
 * チャンピオン入力（オートコンプリート）。通常レーン・BOT両タブで共用（06_ui §4.2）。
 * 選択済みなら アイコン+名前+「×」解除、未選択なら テキスト入力+候補ドロップダウン。
 */
export function ChampionPicker({
  label,
  lane,
  selected,
  onSelect,
  excludeIds = [],
  autoFocus = false,
}: {
  label?: string;
  lane?: string;
  selected: Champion | null;
  onSelect: (champion: Champion | null) => void;
  excludeIds?: string[];
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const candidates =
    query.trim() === ""
      ? []
      : searchChampions(query, lane).filter((c) => !excludeIds.includes(c.id));
  const open = focused && query.trim() !== "";

  const select = (champion: Champion) => {
    onSelect(champion);
    setQuery("");
    setActiveIndex(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (candidates[activeIndex]) select(candidates[activeIndex]);
    } else if (e.key === "Escape") {
      setQuery("");
      setActiveIndex(0);
    }
  };

  return (
    <div className="flex flex-col">
      {label && <span className="mb-3 text-[11px] text-text-muted md:text-[12px]">{label}</span>}

      {selected ? (
        <div className="flex items-center gap-3 rounded-[2px] border border-border bg-bg px-3.5 py-[11px]">
          <Image
            src={championIconUrl(selected.ddragonId)}
            alt={selected.name.ja}
            width={36}
            height={36}
            className="rounded-[2px] bg-icon-bg"
          />
          <span className="flex flex-col">
            <span className="text-[14px] font-bold leading-[1.3] text-text-hi">
              {selected.name.ja}
            </span>
            <span className="text-[10px] text-text-faint">{selected.name.en}</span>
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label={`${selected.name.ja}の選択を解除`}
            className="ml-auto px-1 text-[15px] text-text-faint hover:text-text-hi"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          <input
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="チャンピオン名を入力"
            className={`w-full border border-border bg-bg px-3.5 py-3 text-[13px] text-text-hi outline-none placeholder:text-text-faint focus:border-teal md:text-[14px] ${
              open ? "rounded-t-[2px]" : "rounded-[2px]"
            }`}
          />
          {open && (
            // onMouseDown で input の blur より先に選択を確定させる
            <div
              className="border border-t-0 border-border bg-bg"
              onMouseDown={(e) => e.preventDefault()}
            >
              {candidates.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-[11px] px-3.5 py-2.5 text-left ${
                    i === activeIndex ? "bg-teal/8" : ""
                  }`}
                >
                  <Image
                    src={championIconUrl(c.ddragonId)}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-[2px] bg-icon-bg"
                  />
                  <span className="flex flex-col">
                    <span
                      className={`text-[13px] font-bold leading-[1.3] ${
                        i === activeIndex ? "text-text-hi" : "text-text-body"
                      }`}
                    >
                      {c.name.ja}
                    </span>
                    <span className="text-[10px] text-text-faint">{c.name.en}</span>
                  </span>
                  {i === activeIndex && (
                    <span className="ml-auto text-[10px] text-teal">選択</span>
                  )}
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="px-3.5 py-2.5 text-[12px] text-text-faint">
                  該当するチャンピオンがいません
                </p>
              )}
              <p className="border-t border-border-subtle px-3.5 py-[9px] text-[10px] text-text-faint">
                ひらがな・カタカナ・英語で検索できます
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
