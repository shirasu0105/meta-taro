import { GlossaryChip } from "@/components/ui/GlossaryChip";
import type { GlossaryEntry } from "@/lib/types";

/** 結果ページ下部の用語チップ列（06_ui §3） */
export function GlossaryChipsRow({ refs }: { refs: GlossaryEntry[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-[7px]">
      <span className="mr-0.5 text-[10.5px] text-text-faint">用語:</span>
      {refs.map((entry) => (
        <GlossaryChip key={entry.slug} slug={entry.slug} term={entry.term} />
      ))}
    </div>
  );
}
