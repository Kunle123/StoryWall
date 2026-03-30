/**
 * Discover card copy: date span from **full timeline** bounds (API), title pill text.
 * Date span overlays the image strip; title pill sits above the description.
 */
export function deriveDiscoverCardLabels(
  title: string,
  eventCount: number,
  fullTimelineSpan?: { min?: string; max?: string } | null
): { dateSpan: string; titlePill: string } {
  const safeTitle = (max: number) =>
    title.length > max ? `${title.slice(0, max - 1)}…` : title;

  let dateSpan: string;

  if (fullTimelineSpan?.min && fullTimelineSpan?.max) {
    const yMin = parseInt(String(fullTimelineSpan.min).slice(0, 4), 10);
    const yMax = parseInt(String(fullTimelineSpan.max).slice(0, 4), 10);
    if (Number.isFinite(yMin) && Number.isFinite(yMax)) {
      dateSpan = yMin === yMax ? String(yMin) : `${yMin}–${yMax}`;
    } else {
      dateSpan = eventCount === 0 ? "STORY" : "TIMELINE";
    }
  } else if (eventCount === 0) {
    dateSpan = "STORY";
  } else {
    dateSpan = "TIMELINE";
  }

  return {
    dateSpan,
    titlePill: safeTitle(52),
  };
}

