import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { itemIconUrl, runeIconUrl, summonerSpellUrl } from "@/lib/ddragon";
import type { Recommended } from "@/lib/types";

/** サモナースペルIDの表示名（Data Dragon ID → 日本語名。表示専用の対応表） */
const SPELL_NAMES: Record<string, string> = {
  SummonerFlash: "フラッシュ",
  SummonerDot: "イグナイト",
  SummonerTeleport: "テレポート",
  SummonerHaste: "ゴースト",
  SummonerHeal: "ヒール",
  SummonerSmite: "スマイト",
  SummonerExhaust: "イグゾースト",
  SummonerBarrier: "バリア",
};

function spellName(spellId: string): string {
  return SPELL_NAMES[spellId] ?? spellId.replace(/^Summoner/, "");
}

function KeystoneRow({ runes }: { runes: Recommended["runes"] }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={runeIconUrl(runes.icon)}
        alt={runes.keystone}
        width={44}
        height={44}
        className="rounded-full border border-gold bg-icon-bg"
      />
      <div>
        <p className="text-[14px] font-extrabold text-text-hi">{runes.keystone}</p>
        <p className="text-[10px] text-text-muted">メイン: {runes.primary}</p>
      </div>
    </div>
  );
}

function SpellsRow({ spells }: { spells: string[] }) {
  return (
    <div className="flex gap-4">
      {spells.map((spell) => (
        <div key={spell} className="flex items-center gap-[9px]">
          <Image
            src={summonerSpellUrl(spell)}
            alt={spellName(spell)}
            width={38}
            height={38}
            className="rounded-[2px] border border-border bg-icon-bg"
          />
          <span className="text-[12.5px] font-bold text-text-hi">{spellName(spell)}</span>
        </div>
      ))}
    </div>
  );
}

function CoreRow({ build }: { build: Recommended["build"] }) {
  return (
    <div className="flex items-center gap-[7px]">
      {build.core.map((item, i) => (
        <div key={item.id} className="contents">
          {i > 0 && <span className="text-[12px] text-gold">›</span>}
          <div className="flex w-[54px] flex-col items-center gap-1">
            <Image
              src={itemIconUrl(item.id)}
              alt={item.name}
              width={42}
              height={42}
              className={`rounded-[2px] border bg-icon-bg ${i === 0 ? "border-gold" : "border-border"}`}
            />
            <span className="text-center text-[9px] leading-[1.4] text-text-muted">
              {item.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SituationalRow({ situational }: { situational: Recommended["build"]["situational"] }) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {situational.map(({ item, reason }) => (
        <div key={item.id} className="flex items-center gap-[7px]">
          <Image
            src={itemIconUrl(item.id)}
            alt={item.name}
            width={32}
            height={32}
            className="rounded-[2px] border border-border bg-icon-bg"
          />
          <span className="text-[10px] leading-[1.5] text-text-muted">
            {item.name}
            <br />
            {reason}
          </span>
        </div>
      ))}
    </div>
  );
}

function BootsRow({ boots }: { boots: Recommended["build"]["boots"] }) {
  return (
    <div className="flex items-center gap-[7px]">
      <Image
        src={itemIconUrl(boots.id)}
        alt={boots.name}
        width={34}
        height={34}
        className="rounded-[2px] border border-border bg-icon-bg"
      />
      <span className="text-[10.5px] text-text-muted">{boots.name}</span>
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <span className="w-[58px] flex-none pt-1 text-[10.5px] text-text-muted">{children}</span>;
}

/** BOT結果の推奨セット: 視点ごとの統合1パネル（06_ui §4.4） */
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

/** 通常レーン結果の推奨セット: ルーン / スペル / ビルド の3パネル（06_ui §4.3） */
export function LaneRecommended({ recommended }: { recommended: Recommended }) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-[1fr_1fr_1.3fr]">
      <Panel className="flex flex-col gap-[11px] px-5 py-4">
        <SectionHeading ja="推奨ルーン" en="RUNES" />
        <KeystoneRow runes={recommended.runes} />
        <div className="border-t border-border-subtle pt-[11px] text-[11.5px] text-text-body">
          サブ: {recommended.runes.secondary}
        </div>
      </Panel>
      <Panel className="flex flex-col gap-[11px] px-5 py-4">
        <SectionHeading ja="推奨サモナースペル" en="SPELLS" />
        <SpellsRow spells={recommended.spells} />
      </Panel>
      <Panel className="flex flex-col gap-3 px-5 py-4">
        <SectionHeading ja="推奨ビルド" en="BUILD" />
        <div className="flex items-start gap-3">
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
    </div>
  );
}
