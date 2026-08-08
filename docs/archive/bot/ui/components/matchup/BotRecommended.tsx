// T-1300 で components/matchup/RecommendedPanels.tsx から切り出して退避したもの。
// 元は同ファイル内の非公開ヘルパー（spellName / CoreRow / BootsRow / SituationalRow / RowLabel）を
// 共有していたため、復活時は RecommendedPanels.tsx へ戻し、この import 群は消すこと。
// ビルド対象外（tsconfig.json の exclude / eslint.config.mjs の globalIgnores）。復活の判断は T-1308。
import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { runeIconUrl, summonerSpellUrl } from "@/lib/ddragon";
import type { Recommended } from "@/lib/types";
import { BootsRow, CoreRow, RowLabel, SituationalRow, spellName } from "./_shared";

/** BOT結果の推奨セット: 視点ごとの統合1パネル（06_ui §8） */
export function BotRecommended({ recommended }: { recommended: Recommended }) {
  return (
    <Panel className="flex flex-col gap-3 px-5 py-4">
      <SectionHeading ja="推奨セット" en="RUNES / SPELLS / BUILD" />
      <div className="flex items-center gap-3">
        <Image
          src={runeIconUrl(recommended.runes.icon)}
          alt={recommended.runes.keystone}
          width={42}
          height={42}
          className="rounded-full border border-gold bg-icon-bg"
        />
        <div>
          <p className="text-[13.5px] font-extrabold text-text-hi">
            {recommended.runes.keystone}
          </p>
          <p className="text-[10px] text-text-muted">
            メイン: {recommended.runes.primary} / サブ: {recommended.runes.secondary}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {recommended.spells.map((spell) => (
            <Image
              key={spell}
              src={summonerSpellUrl(spell)}
              alt={spellName(spell)}
              width={34}
              height={34}
              className="rounded-[2px] border border-border bg-icon-bg"
            />
          ))}
        </div>
      </div>
      <div className="flex items-start gap-3 border-t border-border-subtle pt-3">
        <RowLabel>コア</RowLabel>
        <CoreRow build={recommended.build} />
      </div>
      <div className="flex items-center gap-3">
        <RowLabel>靴</RowLabel>
        <BootsRow boots={recommended.build.boots} />
      </div>
      <div className="flex items-start gap-3">
        <RowLabel>状況対応</RowLabel>
        <SituationalRow situational={recommended.build.situational} />
      </div>
    </Panel>
  );
}
