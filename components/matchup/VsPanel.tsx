import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { Panel } from "@/components/ui/Panel";
import { RoleBadge } from "@/components/ui/RoleBadge";
import type { Champion } from "@/lib/types";

export type VsSide = {
  /** 1体（通常レーン）または 2体（BOTペア） */
  champions: Champion[];
  /** バッジ文言:「あなた」「相手」「あなた側」「相手側」 */
  label: string;
};

function Side({ side, tone }: { side: VsSide; tone: "ally" | "enemy" }) {
  const pair = side.champions.length > 1;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex">
        {side.champions.map((c, i) => (
          <span key={c.id} className={i > 0 ? "-ml-2" : ""}>
            <ChampionIcon
              ddragonId={c.ddragonId}
              name={c.name.ja}
              side={tone === "ally" && i === 0 ? "me" : "enemy"}
              size={pair ? 52 : 64}
            />
          </span>
        ))}
      </div>
      <span className="text-center text-[12px] font-extrabold text-text-hi md:text-[13px]">
        {side.champions.map((c) => c.name.ja).join(" + ")}
      </span>
      <RoleBadge tone={tone}>{side.label}</RoleBadge>
    </div>
  );
}

/** VSパネル: 自分（gold枠）vs 相手 + 中央 Cinzel VS（06_ui §4.3 / §4.4） */
export function VsPanel({ mySide, enemySide }: { mySide: VsSide; enemySide: VsSide }) {
  return (
    <Panel className="flex items-center justify-center gap-4 p-[18px] md:gap-[22px]">
      <Side side={mySide} tone="ally" />
      <span className="font-display text-[16px] text-gold">VS</span>
      <Side side={enemySide} tone="enemy" />
    </Panel>
  );
}
