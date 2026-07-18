import { notFound } from "next/navigation";
import { BotViewToggle } from "@/components/matchup/BotViewToggle";
import { DangerSkillsPanel } from "@/components/matchup/DangerSkillsPanel";
import { EvaluationPanel } from "@/components/matchup/EvaluationPanel";
import { GlossaryChipsRow } from "@/components/matchup/GlossaryChipsRow";
import { MatchupHeader } from "@/components/matchup/MatchupHeader";
import { PowerSpikePanel } from "@/components/matchup/PowerSpikePanel";
import { BotRecommended } from "@/components/matchup/RecommendedPanels";
import { SummaryPanel } from "@/components/matchup/SummaryPanel";
import { VsPanel } from "@/components/matchup/VsPanel";
import { getChampion } from "@/lib/champions";
import { getBotMatchup, getGlossary, getMeta, listBotMatchups } from "@/lib/data";
import { buildBotSlug, parseBotSlug } from "@/lib/slug";
import type { BotViewAdvice, GlossaryEntry } from "@/lib/types";

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

export default async function BotMatchupPage({ params }: PageProps<"/matchups/bot/[slug]">) {
  const { slug } = await params;
  const parsed = parseBotSlug(slug);
  if (!parsed) notFound();

  const myAdc = getChampion(parsed.myAdc);
  const mySup = getChampion(parsed.mySup);
  const enemyAdc = getChampion(parsed.enemyAdc);
  const enemySup = getChampion(parsed.enemySup);
  if (!myAdc || !mySup || !enemyAdc || !enemySup) notFound();

  const matchup = getBotMatchup(myAdc.id, mySup.id, enemyAdc.id, enemySup.id);
  if (!matchup) notFound(); // T-207 で「データがありません」表示に差し替える

  const meta = getMeta();
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
