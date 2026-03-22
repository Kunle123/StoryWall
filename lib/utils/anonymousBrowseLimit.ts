/**
 * Anonymous users can open up to MAX unique timelines before being asked to sign in.
 * Stored in localStorage (per browser). Uses canonical timeline id (UUID) when available.
 */

const STORAGE_KEY = "storywall_anon_viewed_timeline_ids";

/** Max number of distinct timelines an anonymous user may open */
export const MAX_ANONYMOUS_TIMELINE_VIEWS = 5;

export function getAnonymousViewedTimelineIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Register a view of this timeline for anonymous users.
 * - Revisiting the same timeline does not consume an additional slot.
 * - Returns allowed: false when the user already has MAX distinct timelines and this is a new one.
 */
export function tryConsumeAnonymousTimelineView(timelineKey: string): {
  allowed: boolean;
  distinctCount: number;
} {
  if (typeof window === "undefined") {
    return { allowed: true, distinctCount: 0 };
  }
  const key = timelineKey.trim();
  if (!key) {
    return { allowed: true, distinctCount: 0 };
  }

  const ids = getAnonymousViewedTimelineIds();
  if (ids.includes(key)) {
    return { allowed: true, distinctCount: ids.length };
  }
  if (ids.length >= MAX_ANONYMOUS_TIMELINE_VIEWS) {
    return { allowed: false, distinctCount: ids.length };
  }

  const next = [...ids, key];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full / private mode — allow read rather than block
    return { allowed: true, distinctCount: next.length };
  }
  return { allowed: true, distinctCount: next.length };
}

/** Call after successful sign-in so limits don't carry over oddly */
export function clearAnonymousBrowseHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
