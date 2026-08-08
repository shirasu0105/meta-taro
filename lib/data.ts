// サーバー専用のデータアクセス層（node:fs を使うためクライアントから import しないこと）。
// すべて同期I/O（docs/02_architecture.md §4: fs.readFileSync / JSON import 方針）。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import glossaryJson from "@/data/glossary.json";
import metaJson from "@/data/meta.json";
import { isChampionSlug, parseLaneSlug } from "@/lib/slug";
import type { GlossaryEntry, Lane, LaneMatchup, Meta } from "@/lib/types";

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

/** generateStaticParams / sitemap 用の全対面列挙。
 * `jg/` は T-1300 でデータを退避したが、**空ディレクトリは消さないこと**
 * （readdirSync が例外を投げる。03_database §2） */
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

// getBotMatchup / listBotMatchups は T-1300 で削除した
// （docs/archive/bot/ui/lib/bot-fragments.ts に退避。復活の判断は T-1308）。
