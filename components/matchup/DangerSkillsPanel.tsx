import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { spellIconUrl } from "@/lib/ddragon";
import type { DangerSkill } from "@/lib/types";

/** 注意スキル DANGER パネル（06_ui §4.3） */
export function DangerSkillsPanel({ skills }: { skills: DangerSkill[] }) {
  return (
    <Panel className="flex flex-col gap-[13px] px-5 py-4">
      <SectionHeading ja="注意スキル" en="DANGER" />
      {skills.map((skill) => (
        <div key={`${skill.slot}-${skill.name}`} className="flex items-start gap-[11px]">
          <Image
            src={spellIconUrl(skill.icon)}
            alt={skill.name}
            width={40}
            height={40}
            className="rounded-[2px] border border-border bg-icon-bg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-[2px] border border-teal/40 px-[5px] py-px text-[10px] font-extrabold text-teal">
                {skill.slot}
              </span>
              <span className="text-[13px] font-bold text-text-hi">{skill.name}</span>
              <span className="ml-auto whitespace-nowrap rounded-[2px] border border-danger/40 px-[7px] py-0.5 text-[9.5px] font-bold text-danger">
                {skill.tag}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-[1.7] text-text-muted">
              {skill.description}
            </p>
          </div>
        </div>
      ))}
    </Panel>
  );
}
