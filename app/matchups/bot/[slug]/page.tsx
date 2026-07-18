import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotViewToggle } from "@/components/matchup/BotViewToggle";
import { DangerSkillsPanel } from "@/components/matchup/DangerSkillsPanel";
import { EvaluationPanel } from "@/components/matchup/EvaluationPanel";
import { GlossaryChipsRow } from "@/components/matchup/GlossaryChipsRow";
import { MatchupHeader } from "@/components/matchup/MatchupHeader";
import { NoDataPanel } from "@/components/matchup/NoDataPanel";
import { PowerSpikePanel } from "@/components/matchup/PowerSpikePanel";
import { BotRecommended } from "@/components/matchup/RecommendedPanels";
import { SummaryPanel } from "@/components/matchup/SummaryPanel";
import { VsPanel } from "@/components/matchup/VsPanel";
import { getChampion } from "@/lib/champions";
import { getBotMatchup, getGlossary, getMeta, listBotMatchups } from "@/lib/data";
import { buildBotSlug, parseBotSlug } from "@/lib/slug";
import type { BotViewAdvice, Champion, GlossaryEntry } from "@/lib/types";

/** モック2件を静的生成。対象外の slug はオンデマンド描画（02_architecture §4） */
export function generateStaticParams() {
  return listBotMatchups().map((m) => ({
    slug: buildBotSlug(m.myAdc, m.mySup, m.enemyAdc, m.enemySup),
  }));
}

/** 視点別のパネル群。BotViewAdvice に gamePlan は無い（03_database §3） */
function ViewSection({ view, glossary }: { view: BotViewAdvice; glossary: GlossaryEntry[] }) {
  const refs = glossary.filter((g) => view.glossaryRefs.includes(g.slug));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SummaryPanel text={view.summary} refs={refs} />
          <DangerSkillsPanel skills={view.dangerSkills} />
        </div>
        <div className="flex flex-col gap-4">
          <PowerSpikePanel spike={view.powerSpike} myLabel="自ペア" enemyLabel="敵ペア" refs={refs} />
          <BotRecommended recommended={view.recommended} />
        </div>
      </div>
      <GlossaryChipsRow refs={refs} />
    </div>
  );
}

/** slug から4体を解決。不正 slug / 未知チャンピオンは null（= 404） */
function resolveParams(
  slug: string,
): { myAdc: Champion; mySup: Champion; enemyAdc: Champion; enemySup: Champion } | null {
  const parsed = parseBotSlug(slug);
  if (!parsed) return null;
  const myAdc = getChampion(parsed.myAdc);
  const mySup = getChampion(parsed.mySup);
  const enemyAdc = getChampion(parsed.enemyAdc);
  const enemySup = getChampion(parsed.enemySup);
  if (!myAdc || !mySup || !enemyAdc || !enemySup) return null;
  return { myAdc, mySup, enemyAdc, enemySup };
}

/**
 * データなし（null）時は noindex（06_ui §4.6 / T-207）。
 * データあり時は仮タイトルのみ — description / OG は T-301（P3）で拡張する。
 */
export async function generateMetadata({
  params,
}: PageProps<"/matchups/bot/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveParams(slug);
  if (!resolved) return {}; // notFound（404）になるため metadata 不要
  const matchup = getBotMatchup(
    resolved.myAdc.id,
    resolved.mySup.id,
    resolved.enemyAdc.id,
    resolved.enemySup.id,
  );
  if (!matchup) {
    return {
      title: "データがありません | Metaたろう",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${resolved.myAdc.name.ja} + ${resolved.mySup.name.ja} vs ${resolved.enemyAdc.name.ja} + ${resolved.enemySup.name.ja} BOT対面攻略 | Metaたろう`,
  };
}

export default async function BotMatchupPage({ params }: PageProps<"/matchups/bot/[slug]">) {
  const { slug } = await params;
  const resolved = resolveParams(slug);
  if (!resolved) notFound();

  const { myAdc, mySup, enemyAdc, enemySup } = resolved;
  const matchup = getBotMatchup(myAdc.id, mySup.id, enemyAdc.id, enemySup.id);
  const meta = getMeta();

  // データなし: 同レイアウト内に「データがありません」パネル（FR-013 / T-207）
  if (!matchup) {
    return (
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 pb-10 pt-5 md:px-12 md:pt-[26px]">
        <MatchupHeader badge="BOT 2v2" meta={meta} />
        <div className="grid gap-4 md:mx-auto md:w-[520px]">
          <VsPanel
            mySide={{ champions: [myAdc, mySup], label: "あなた側" }}
            enemySide={{ champions: [enemyAdc, enemySup], label: "相手側" }}
          />
          <NoDataPanel />
        </div>
      </main>
    );
  }

  const glossary = getGlossary();

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 pb-10 pt-5 md:px-12 md:pt-[26px]">
      <MatchupHeader badge="BOT 2v2" meta={meta} />

      <div className="grid gap-4 md:grid-cols-[420px_1fr]">
        <VsPanel
          mySide={{ champions: [myAdc, mySup], label: "あなた側" }}
          enemySide={{ champions: [enemyAdc, enemySup], label: "相手側" }}
        />
        <EvaluationPanel
          aiRating={matchup.aiRating}
          advantage={matchup.advantage}
          winRate={matchup.winRate}
          winRateNote="ペア統計 · Gold+ · 直近パッチ"
          footnote="評価・勝率は4体の組み合わせ統計。立ち回りは下の視点トグルで切り替え。"
        />
      </div>

      <BotViewToggle
        adcLabel={`ADC視点 · ${myAdc.name.ja}`}
        supLabel={`SUP視点 · ${mySup.name.ja}`}
        adcContent={<ViewSection view={matchup.views.adc} glossary={glossary} />}
        supContent={<ViewSection view={matchup.views.sup} glossary={glossary} />}
      />
    </main>
  );
}
