import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { GlossaryEntry, PowerSpike, SpikeMark } from "@/lib/types";
import { GlossaryText } from "./GlossaryText";

const CELL_STYLES: Record<"me" | "enemy", Record<SpikeMark, string>> = {
  me: {
    "◎": "text-teal bg-teal/14",
    "○": "text-[#6FD3CA] bg-teal/6",
    "△": "text-[#7C8698] bg-[#12203A]",
  },
  enemy: {
    "◎": "text-danger bg-danger/14",
    "○": "text-[#D89B96] bg-danger/6",
    "△": "text-[#7C8698] bg-[#12203A]",
  },
};

function SpikeRow({
  label,
  side,
  marks,
}: {
  label: string;
  side: "me" | "enemy";
  marks: { early: SpikeMark; mid: SpikeMark; late: SpikeMark };
}) {
  return (
    <>
      <span className="text-[12px] font-bold text-text-hi">{label}</span>
      {([marks.early, marks.mid, marks.late] as const).map((mark, i) => (
        <span
          key={i}
          className={`rounded-[2px] py-[9px] text-center text-[14px] font-extrabold ${CELL_STYLES[side][mark]}`}
        >
          {mark}
        </span>
      ))}
    </>
  );
}

/** パワースパイク POWER SPIKE: 自分/相手 × 序盤/中盤/終盤 の ◎○△（06_ui §4.3） */
export function PowerSpikePanel({
  spike,
  myLabel,
  enemyLabel,
  refs,
}: {
  spike: PowerSpike;
  myLabel: string;
  enemyLabel: string;
  refs: GlossaryEntry[];
}) {
  return (
    <Panel className="flex flex-col gap-[11px] px-5 py-4">
      <SectionHeading ja="パワースパイク" en="POWER SPIKE" />
      <div className="grid grid-cols-[72px_1fr_1fr_1fr] items-center gap-[7px]">
        <span />
        {["序盤", "中盤", "終盤"].map((phase) => (
          <span key={phase} className="text-center text-[10px] text-text-faint">
            {phase}
          </span>
        ))}
        <SpikeRow label={myLabel} side="me" marks={spike.me} />
        <SpikeRow label={enemyLabel} side="enemy" marks={spike.enemy} />
      </div>
      <p className="text-[11px] leading-[1.7] text-text-muted">
        <GlossaryText text={spike.note} refs={refs} />
      </p>
    </Panel>
  );
}
