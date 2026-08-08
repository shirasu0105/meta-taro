// T-1300 で各ファイルから削除した BOT 専用の断片をそのまま集めたもの。
// 1ファイルにまとめてあるだけで、復活時は下記の見出しどおり元のファイルへ戻す。
// このファイルはビルド対象外（tsconfig.json の exclude / eslint.config.mjs の globalIgnores）。
// 復活の判断は T-1308。手順は docs/archive/README.md。

// ---------------------------------------------------------------------------
// lib/types.ts
// ---------------------------------------------------------------------------

export type BotViewAdvice = {
  summary: string;
  dangerSkills: DangerSkill[];
  powerSpike: PowerSpike;
  recommended: Recommended;
  glossaryRefs: string[];
};

export type BotMatchup = {
  myAdc: string;
  mySup: string;
  enemyAdc: string;
  enemySup: string;
  aiRating: 1 | 2 | 3 | 4 | 5;
  advantage: string;
  winRate?: number; // ペア統計。上に同じく Phase 1 では未使用
  views: { adc: BotViewAdvice; sup: BotViewAdvice };
};

// ---------------------------------------------------------------------------
// lib/slug.ts
// ---------------------------------------------------------------------------

/** BOT: `{myAdc}-{mySup}-vs-{enAdc}-{enSup}` */
export function buildBotSlug(
  myAdc: string,
  mySup: string,
  enemyAdc: string,
  enemySup: string,
): string {
  return `${myAdc}-${mySup}-vs-${enemyAdc}-${enemySup}`;
}

export function parseBotSlug(
  slug: string,
): { myAdc: string; mySup: string; enemyAdc: string; enemySup: string } | null {
  const sides = slug.split("-vs-");
  if (sides.length !== 2) return null;
  const mine = sides[0].split("-");
  const theirs = sides[1].split("-");
  if (mine.length !== 2 || theirs.length !== 2) return null;
  const [myAdc, mySup] = mine;
  const [enemyAdc, enemySup] = theirs;
  if (![myAdc, mySup, enemyAdc, enemySup].every(isChampionSlug)) return null;
  return { myAdc, mySup, enemyAdc, enemySup };
}

// ---------------------------------------------------------------------------
// lib/data.ts（matchupsDir = join(process.cwd(), "data", "matchups")）
// ---------------------------------------------------------------------------

/** BOT対面。データなしは null */
export function getBotMatchup(
  myAdc: string,
  mySup: string,
  enemyAdc: string,
  enemySup: string,
): BotMatchup | null {
  const ids = [myAdc, mySup, enemyAdc, enemySup];
  if (!ids.every(isChampionSlug)) return null;
  const file = join(matchupsDir, "bot", `${myAdc}-${mySup}-vs-${enemyAdc}-${enemySup}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as BotMatchup;
}

export function listBotMatchups(): {
  myAdc: string;
  mySup: string;
  enemyAdc: string;
  enemySup: string;
}[] {
  return readdirSync(join(matchupsDir, "bot"))
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const parsed = parseBotSlug(f.replace(/\.json$/, ""));
      return parsed ? [parsed] : [];
    });
}

// ---------------------------------------------------------------------------
// lib/seo.ts（DESCRIPTION_MAX / truncate / MatchupSeo は本体に残っている）
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// lib/history.ts — HistoryEntry のBOT側。復活時は union に戻し、
// entryHref / isValidEntry / frequentChampionIds の分岐も併せて復元する
// ---------------------------------------------------------------------------

export type BotHistoryEntry = {
  kind: "bot";
  myAdc: string;
  mySup: string;
  enemyAdc: string;
  enemySup: string;
};

// entryHref の BOT 側
//   : `/matchups/bot/${buildBotSlug(entry.myAdc, entry.mySup, entry.enemyAdc, entry.enemySup)}`
//
// isValidEntry の BOT 側
//   if (e.kind === "bot") {
//     const ids = [e.myAdc, e.mySup, e.enemyAdc, e.enemySup];
//     return ids.every((id) => typeof id === "string" && isChampionSlug(id));
//   }
//
// frequentChampionIds の BOT 側（「自分側」は ADC / SUP の2体）
//   const ids = entry.kind === "lane" ? [entry.me] : [entry.myAdc, entry.mySup];

// ---------------------------------------------------------------------------
// app/sitemap.ts — statics / laneMatchups に続けて連結していた節
// ---------------------------------------------------------------------------

const botMatchups: MetadataRoute.Sitemap = listBotMatchups().map((m) => ({
  url: `${base}/matchups/bot/${buildBotSlug(m.myAdc, m.mySup, m.enemyAdc, m.enemySup)}`,
  lastModified,
  changeFrequency: "weekly",
  priority: 0.8,
}));

// return [...statics, ...laneMatchups, ...botMatchups];

// ---------------------------------------------------------------------------
// components/search/RecentSearches.tsx — BOT 分岐
// ---------------------------------------------------------------------------

// RecentSearches は kind プロパティを取り、履歴を kind で絞り込んでいた:
//   export function RecentSearches({ kind }: { kind: HistoryEntry["kind"] })
//   const chips = useSearchHistory().filter((e) => e.kind === kind)...
//
// toChip の BOT 分岐:
//   const ids = entry.kind === "lane"
//     ? [entry.me, entry.enemy]
//     : [entry.myAdc, entry.mySup, entry.enemyAdc, entry.enemySup];
//   const label = entry.kind === "lane"
//     ? `${entry.lane.toUpperCase()} · ${names[0]} vs ${names[1]}`
//     : `BOT · ${names[0]}・${names[1]} vs ${names[2]}・${names[3]}`;
