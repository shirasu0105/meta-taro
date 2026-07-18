import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { GlossaryEntry } from "@/lib/types";
import { GlossaryText } from "./GlossaryText";

/** 要約 SUMMARY パネル（06_ui §4.3） */
export function SummaryPanel({ text, refs }: { text: string; refs: GlossaryEntry[] }) {
  return (
    <Panel className="flex flex-col gap-[9px] px-5 py-4">
      <SectionHeading ja="要約" en="SUMMARY" />
      <p className="text-[13px] leading-[2] text-text-body">
        <GlossaryText text={text} refs={refs} />
      </p>
    </Panel>
  );
}
