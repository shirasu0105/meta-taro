// サーバー専用のデータアクセス層（node:fs を使うためクライアントから import しないこと）。
// すべて同期I/O（docs/02_architecture.md §4: fs.readFileSync / JSON import 方針）。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import glossaryJson from "@/data/glossary.json";
import metaJson from "@/data/meta.json";
import { isChampionSlug, parseBotSlug, parseLaneSlug } from "@/lib/slug";
import type { BotMatchup, GlossaryEntry, Lane, LaneMatchup, Meta } from "@/lib/types";

const LANES: Lane[] = ["top", "jg", "mid"];
const matchupsDir = join(process.cwd(), "data", "matchups");

export function getMeta(): Meta {
  return metaJson as Meta;
}

export function getGlossary(): GlossaryEntry[] {
  return glossaryJson as GlossaryEntry[];
}

/** 通常レーン対面。データなしは null（URLパラメータが直接届くため slug 形式を必ず検証する） */
export function getLaneMatchup(lane: Lane, me: string, enemy: string): LaneMatchup | null {
  if (!LANES.includes(lane)) return null;
  if (!isChampionSlug(me) || !isChampionSlug(enemy)) return null;
  const file = join(matchupsDir, lane, `${me}-vs-${enemy}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as LaneMatchup;
}

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

/** generateStaticParams / sitemap 用の全対面列挙 */
export function listLaneMatchups(): { lane: Lane; me: string; enemy: string }[] {
  return LANES.flatMap((lane) =>
    readdirSync(join(matchupsDir, lane))
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => {
        const parsed = parseLaneSlug(f.replace(/\.json$/, ""));
        return parsed ? [{ lane, ...parsed }] : [];
      }),
  );
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
