import type { MetadataRoute } from "next";
import { listPublicTimelinesForSitemap } from "@/lib/db/timelines";
import { getSiteOrigin } from "@/lib/utils/siteUrl";

/** Regenerate sitemap periodically (public timeline list). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  if (!base && process.env.NODE_ENV === "production") {
    console.warn(
      "[sitemap] NEXT_PUBLIC_APP_URL is not set; sitemap URLs may be wrong"
    );
  }
  const origin = base || "http://localhost:3000";

  const timelines = await listPublicTimelinesForSitemap();

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${origin}/guide/great-stories`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    ...timelines.map((t) => ({
      url: `${origin}/timeline/${encodeURIComponent(t.pathSegment)}`,
      lastModified: t.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
