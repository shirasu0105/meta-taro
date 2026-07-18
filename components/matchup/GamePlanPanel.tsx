import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { GlossaryEntry, LaneMatchup } from "@/lib/types";
import { GlossaryText } from "./GlossaryText";

const PHASES: { key: keyof LaneMatchup["gamePlan"]; label: string }[] = [
  { key: "early", label: "序盤" },
  { key: "mid", label: "中盤" },
  { key: "late", label: "終盤" },
];

/** 詳細立ち回り GAME PLAN パネル。通常レーン専用（BotViewAdvice に gamePlan は無い） */
export function GamePlanPanel({
  gamePlan,
  refs,
}: {
  gamePlan: LaneMatchup["gamePlan"];
  refs: GlossaryEntry[];
}) {
  return (
    <Panel className="flex flex-col gap-[13px] px-5 py-4">
      <SectionHeading ja="詳細立ち回り" en="GAME PLAN" />
      {PHASES.map((phase) => (
        <div key={phase.key} className="flex gap-[11px]">
          <span className="h-fit flex-none rounded-[2px] border border-gold/50 px-2 py-[3px] text-[10.5px] font-extrabold text-gold">
            {phase.label}
          </span>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            <GlossaryText text={gamePlan[phase.key]} refs={refs} />
          </p>
        </div>
      ))}
    </Panel>
  );
}
