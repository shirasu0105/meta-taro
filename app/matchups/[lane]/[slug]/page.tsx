import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerSkillsPanel } from "@/components/matchup/DangerSkillsPanel";
import { EvaluationPanel } from "@/components/matchup/EvaluationPanel";
import { GamePlanPanel } from "@/components/matchup/GamePlanPanel";
import { GlossaryChipsRow } from "@/components/matchup/GlossaryChipsRow";
import { MatchupHeader } from "@/components/matchup/MatchupHeader";
import { NoDataPanel } from "@/components/matchup/NoDataPanel";
import { PowerSpikePanel } from "@/components/matchup/PowerSpikePanel";
import { LaneRecommended } from "@/components/matchup/RecommendedPanels";
import { SummaryPanel } from "@/components/matchup/SummaryPanel";
import { VsPanel } from "@/components/matchup/VsPanel";
import { getChampion } from "@/lib/champions";
import { getGlossary, getLaneMatchup, getMeta, listLaneMatchups } from "@/lib/data";
import { buildLaneSlug, parseLaneSlug } from "@/lib/slug";
import type { Champion, Lane } from "@/lib/types";

const LANES: readonly Lane[] = ["top", "jg", "mid"];

/** モック6件を静的生成。対象外の slug はオンデマンド描画（02_architecture §4） */
export function generateStaticParams() {
  return listLaneMatchups().map((m) => ({
    lane: m.lane,
    slug: buildLaneSlug(m.me, m.enemy),
  }));
}

/** URLパラメータの検証。不正 lane / 不正 slug / 未知チャンピオンは null（= 404） */
function resolveParams(
  lane: string,
  slug: string,
): { lane: Lane; me: Champion; enemy: Champion } | null {
  if (!LANES.includes(lane as Lane)) return null;
  const parsed = parseLaneSlug(slug);
  if (!parsed) return null;
  const me = getChampion(parsed.me);
  const enemy = getChampion(parsed.enemy);
  if (!me || !enemy) return null;
  return { lane: lane as Lane, me, enemy };
}

/**
 * データなし（null）時は noindex（06_ui §4.6 / T-207）。
 * データあり時は仮タイトルのみ — description / OG は T-301（P3）で拡張する。
 */
export async function generateMetadata({
  params,
}: PageProps<"/matchups/[lane]/[slug]">): Promise<Metadata> {
  const { lane, slug } = await params;
  const resolved = resolveParams(lane, slug);
  if (!resolved) return {}; // notFound（404）になるため metadata 不要
  const matchup = getLaneMatchup(resolved.lane, resolved.me.id, resolved.enemy.id);
  if (!matchup) {
    return {
      title: "データがありません | Metaたろう",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${resolved.me.name.ja} vs ${resolved.enemy.name.ja} ${resolved.lane.toUpperCase()}対面攻略 | Metaたろう`,
  };
}

export default async function LaneMatchupPage({
  params,
}: PageProps<"/matchups/[lane]/[slug]">) {
  const { lane, slug } = await params;
  const resolved = resolveParams(lane, slug);
  if (!resolved) notFound();

  const { me, enemy } = resolved;
  const matchup = getLaneMatchup(resolved.lane, me.id, enemy.id);
  const meta = getMeta();

  // データなし: 同レイアウト内に「データがありません」パネル（FR-013 / T-207）
  if (!matchup) {
    return (
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 pb-10 pt-5 md:px-12 md:pt-[26px]">
        <MatchupHeader badge={resolved.lane.toUpperCase()} meta={meta} />
        <div className="grid gap-4 md:mx-auto md:w-[520px]">
          <VsPanel
            mySide={{ champions: [me], label: "あなた" }}
            enemySide={{ champions: [enemy], label: "相手" }}
          />
          <NoDataPanel />
        </div>
      </main>
    );
  }

  const refs = getGlossary().filter((g) => matchup.glossaryRefs.includes(g.slug));

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 pb-10 pt-5 md:px-12 md:pt-[26px]">
      <MatchupHeader badge={resolved.lane.toUpperCase()} meta={meta} />

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <VsPanel
          mySide={{ champions: [me], label: "あなた" }}
          enemySide={{ champions: [enemy], label: "相手" }}
        />
        <EvaluationPanel
          aiRating={matchup.aiRating}
          advantage={matchup.advantage}
          winRate={matchup.winRate}
          winRateNote={`${me.name.ja}視点 · Gold+ · 直近パッチ`}
          footnote="AI評価は統計＋対面知識の総合判断。勝率は統計値をそのまま表示しています。"
        />
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SummaryPanel text={matchup.summary} refs={refs} />
          <GamePlanPanel gamePlan={matchup.gamePlan} refs={refs} />
        </div>
        <div className="flex flex-col gap-4">
          <DangerSkillsPanel skills={matchup.dangerSkills} />
          <PowerSpikePanel
            spike={matchup.powerSpike}
            myLabel={me.name.ja}
            enemyLabel={enemy.name.ja}
            refs={refs}
          />
        </div>
      </div>

      <LaneRecommended recommended={matchup.recommended} />
      <GlossaryChipsRow refs={refs} />
    </main>
  );
}
