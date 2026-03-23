import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/utils/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
