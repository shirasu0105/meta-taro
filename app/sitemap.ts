import type { MetadataRoute } from "next";
import { getMeta, listBotMatchups, listLaneMatchups } from "@/lib/data";
import { siteUrl } from "@/lib/seo";
import { buildBotSlug, buildLaneSlug } from "@/lib/slug";

/** 静的3ページ + 全対面ページ（docs/04_api.md §3）。lastModified は週次データ更新日 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = getMeta().updatedAt;

  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/search`, lastModified, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/glossary`, lastModified, changeFrequency: "weekly", priority: 0.5 },
  ];

  const laneMatchups: MetadataRoute.Sitemap = listLaneMatchups().map((m) => ({
    url: `${base}/matchups/${m.lane}/${buildLaneSlug(m.me, m.enemy)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const botMatchups: MetadataRoute.Sitemap = listBotMatchups().map((m) => ({
    url: `${base}/matchups/bot/${buildBotSlug(m.myAdc, m.mySup, m.enemyAdc, m.enemySup)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...statics, ...laneMatchups, ...botMatchups];
}
