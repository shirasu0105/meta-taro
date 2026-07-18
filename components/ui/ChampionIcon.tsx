import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";

/** チャンピオンアイコン。自分側=gold枠 / 相手側=通常枠（06_ui §3） */
export function ChampionIcon({
  ddragonId,
  name,
  side = "neutral",
  size = 64,
}: {
  ddragonId: string;
  name: string;
  side?: "me" | "enemy" | "neutral";
  size?: number;
}) {
  const borderColor = side === "me" ? "border-gold" : "border-border";
  return (
    <Image
      src={championIconUrl(ddragonId)}
      alt={name}
      width={size}
      height={size}
      className={`rounded-[2px] border ${borderColor} bg-icon-bg`}
    />
  );
}
