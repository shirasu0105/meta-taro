// 対面ページのSEOメタデータ・JSON-LDの共通ロジック（docs/04_api.md §3）。
// generateMetadata と JSON-LD の双方で使い、文言の二重管理を防ぐ。fs には依存しない。
import { splashUrl } from "@/lib/ddragon";
import { buildBotSlug, buildLaneSlug } from "@/lib/slug";
import type { BotMatchup, Champion, Lane, LaneMatchup } from "@/lib/types";

export const SITE_NAME = "Metaたろう";

/**
 * サイトのベースURL。本番ドメイン未確定（07_release.md）のため、
 * NEXT_PUBLIC_SITE_URL → Vercel本番URL → localhost の順で解決する。
 * ドメイン取得後は NEXT_PUBLIC_SITE_URL を設定するだけで切り替わる。
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/** meta description の推奨長に収める */
const DESCRIPTION_MAX = 110;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export type MatchupSeo = {
  heading: string; // ページ固有部分（og:title / JSON-LD headline 用）
  title: string; // `<title>`（heading + サイト名）
  description: string;
  path: string; // サイト内相対パス（canonical / og:url 用）
  image: string; // OG画像（Data Dragon スプラッシュ・絶対URL）
};

export function laneMatchupSeo(
  me: Champion,
  enemy: Champion,
  lane: Lane,
  matchup: LaneMatchup,
): MatchupSeo {
  const heading = `${me.name.ja} vs ${enemy.name.ja} ${lane.toUpperCase()}対面攻略`;
  return {
    heading,
    title: `${heading} | ${SITE_NAME}`,
    description: truncate(
      `${me.name.ja} vs ${enemy.name.ja}（${lane.toUpperCase()}）対面のAIアドバイス。${matchup.summary}`,
      DESCRIPTION_MAX,
    ),
    path: `/matchups/${lane}/${buildLaneSlug(me.id, enemy.id)}`,
    image: splashUrl(me.ddragonId),
  };
}

export function botMatchupSeo(
  myAdc: Champion,
  mySup: Champion,
  enemyAdc: Champion,
  enemySup: Champion,
  matchup: BotMatchup,
): MatchupSeo {
  const mine = `${myAdc.name.ja} + ${mySup.name.ja}`;
  const theirs = `${enemyAdc.name.ja} + ${enemySup.name.ja}`;
  const heading = `${mine} vs ${theirs} BOT対面攻略`;
  return {
    heading,
    title: `${heading} | ${SITE_NAME}`,
    description: truncate(
      `${mine} vs ${theirs}（BOT 2v2）対面のAIアドバイス。${matchup.views.adc.summary}`,
      DESCRIPTION_MAX,
    ),
    path: `/matchups/bot/${buildBotSlug(myAdc.id, mySup.id, enemyAdc.id, enemySup.id)}`,
    image: splashUrl(myAdc.ddragonId),
  };
}
