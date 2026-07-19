"use client";

import Image from "next/image";
import Link from "next/link";
import { getChampion } from "@/lib/champions";
import { championIconUrl } from "@/lib/ddragon";
import { entryHref, type HistoryEntry } from "@/lib/history";
import type { Champion } from "@/lib/types";
import { useSearchHistory } from "./useSearchHistory";

type Chip = { href: string; champions: Champion[]; label: string };

/** チップ1件分の表示内容。未知チャンピオンが混じるエントリは描画しない */
function toChip(entry: HistoryEntry): Chip | null {
  const ids =
    entry.kind === "lane"
      ? [entry.me, entry.enemy]
      : [entry.myAdc, entry.mySup, entry.enemyAdc, entry.enemySup];
  const champions: Champion[] = [];
  for (const id of ids) {
    const champion = getChampion(id);
    if (!champion) return null;
    champions.push(champion);
  }
  const names = champions.map((c) => c.name.ja);
  const label =
    entry.kind === "lane"
      ? `${entry.lane.toUpperCase()} · ${names[0]} vs ${names[1]}`
      : `BOT · ${names[0]}・${names[1]} vs ${names[2]}・${names[3]}`;
  return { href: entryHref(entry), champions, label };
}

/** 「最近の検索」チップ列（06_ui §4.2 / T-402）。履歴が無ければ行ごと出さない */
export function RecentSearches({ kind }: { kind: HistoryEntry["kind"] }) {
  const chips = useSearchHistory()
    .filter((e) => e.kind === kind)
    .flatMap((entry) => {
      const chip = toChip(entry);
      return chip ? [chip] : [];
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-3.5 md:flex-row md:items-start md:gap-3">
      {/* チップが複数行に折り返しても先頭行と揃うよう、上寄せ + 光学的な余白で調整する */}
      <span className="text-[11px] text-text-muted md:w-[72px] md:shrink-0 md:pt-[11px] md:text-[12px]">
        最近の検索
      </span>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
        {chips.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="flex w-full items-center gap-2 rounded-[2px] border border-border-subtle bg-panel px-2.5 py-2 hover:border-border md:w-auto md:gap-[9px] md:px-[14px]"
          >
            {chip.champions.map((c) => (
              <Image
                key={c.id}
                src={championIconUrl(c.ddragonId)}
                alt=""
                width={24}
                height={24}
                className="size-[22px] rounded-[2px] bg-icon-bg md:size-6"
              />
            ))}
            <span className="text-[11.5px] text-text-body md:text-[12px]">{chip.label}</span>
            <span className="ml-auto pl-1 text-[14px] text-text-faint">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
