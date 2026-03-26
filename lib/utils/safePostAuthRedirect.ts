import { getSiteOrigin } from "@/lib/utils/siteUrl";

const DEFAULT_POST_AUTH = "/legal/accept-terms";

/**
 * Safe path after sign-in/up: supports ?redirect=/path and Clerk's ?redirect_url=full-url.
 * Same-origin only; rejects open redirects.
 */
export function getSafePostAuthPathFromSearchParams(
  searchParams: URLSearchParams,
  defaultPath: string = DEFAULT_POST_AUTH
): string {
  const raw =
    searchParams.get("redirect")?.trim() ||
    searchParams.get("redirect_url")?.trim();
  if (!raw) return defaultPath;

  try {
    if (raw.startsWith("/")) {
      if (raw.startsWith("//")) return defaultPath;
      return raw;
    }
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const u = new URL(raw);
      const expected =
        typeof window !== "undefined"
          ? window.location.origin
          : getSiteOrigin();
      if (!expected) return defaultPath;
      if (u.origin !== new URL(expected).origin) return defaultPath;
      const path = `${u.pathname}${u.search}`;
      return path || defaultPath;
    }
  } catch {
    return defaultPath;
  }
  return defaultPath;
}

export { DEFAULT_POST_AUTH };
