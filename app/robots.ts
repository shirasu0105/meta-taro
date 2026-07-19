import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** 全許可 + sitemap参照（docs/04_api.md §3） */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
