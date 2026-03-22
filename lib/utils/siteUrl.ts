/**
 * Canonical site origin for metadata, OG URLs, and sitemaps.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://storywall.app).
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }
  return "";
}

/** Absolute URL for a path (e.g. `/timeline/abc`). */
export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

/** Ensure image URL is absolute for og:image / Twitter (many crawlers require it). */
export function absoluteImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = getSiteOrigin();
  if (!base) return u;
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}
