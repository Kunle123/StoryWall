/**
 * Where to send the user after accepting T&Cs on /legal/accept-terms.
 * Same-origin only; avoids loops back to accept-terms; supports returnUrl / redirect / redirect_url.
 */
export function getPostAcceptTermsDestination(
  search: string,
  pageOrigin: string
): string {
  const params = new URLSearchParams(search);
  const keys = ["returnUrl", "redirect", "redirect_url"] as const;
  let raw: string | null = null;
  for (const k of keys) {
    const v = params.get(k);
    if (v?.trim()) {
      raw = v.trim();
      break;
    }
  }
  if (!raw) return "/";

  const isAcceptLoop = (pathWithQuery: string) =>
    pathWithQuery === "/legal/accept-terms" ||
    pathWithQuery.startsWith("/legal/accept-terms?");

  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const u = new URL(raw);
      if (u.origin !== pageOrigin) return "/";
      const path = `${u.pathname}${u.search}`;
      if (isAcceptLoop(path)) return "/";
      return path || "/";
    }
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    if (isAcceptLoop(path.split("#")[0])) return "/";
    return path;
  } catch {
    return "/";
  }
}

export function toAbsoluteAppUrl(pathOrPathWithQuery: string, origin: string): string {
  const base = pathOrPathWithQuery.startsWith("/") ? pathOrPathWithQuery : `/${pathOrPathWithQuery}`;
  return new URL(base, origin).href;
}
