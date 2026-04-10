/** Fields used for ordering (matches `Timeline` / `TimelineEvent`). */
export type SortableTimelineEvent = {
  number?: number;
  year?: number;
  month?: number;
  day?: number;
};

/** Same ordering as `Timeline` (date / numbered). */
export function sortTimelineEvents<T extends SortableTimelineEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    if (a.number && b.number) {
      return a.number - b.number;
    }
    if (a.number && !b.number) return -1;
    if (!a.number && b.number) return 1;
    if (a.year && b.year) {
      if (a.year < 0 || b.year < 0) {
        return a.year - b.year;
      }
      const dateA = new Date(a.year, a.month || 0, a.day || 1);
      const dateB = new Date(b.year, b.month || 0, b.day || 1);
      return dateA.getTime() - dateB.getTime();
    }
    return 0;
  });
}
