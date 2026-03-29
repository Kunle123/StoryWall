/**
 * Stacked label lines for discover cards (year/topic), from preview events + title.
 * See GitHub #30 — brand styling applied in `StoryWallDateBadges`.
 */
export function deriveStoryDateLabels(
  events: { date?: string }[],
  title: string,
  eventCount: number
): { top: string; bottom: string } {
  const ev = events ?? [];
  const safeTitle = (max: number) =>
    title.length > max ? `${title.slice(0, max - 1)}…` : title;

  if (ev.length === 0) {
    return {
      top: "STORY",
      bottom: safeTitle(40),
    };
  }

  const years: number[] = [];
  for (const e of ev) {
    if (!e.date) continue;
    const y = parseInt(String(e.date).split("-")[0], 10);
    if (Number.isFinite(y)) years.push(y);
  }

  if (years.length === 0) {
    return {
      top: "TIMELINE",
      bottom: safeTitle(40),
    };
  }

  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const top = minY === maxY ? String(minY) : `${minY}–${maxY}`;
  const bottom = `${eventCount} event${eventCount === 1 ? "" : "s"} · ${safeTitle(36)}`;

  return { top, bottom };
}
