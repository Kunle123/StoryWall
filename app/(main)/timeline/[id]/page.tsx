import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTimelineById, getTimelineBySlug } from "@/lib/db/timelines";
import { getEventsByTimelineId } from "@/lib/db/events";
import { transformApiEventToTimelineEvent } from "@/lib/api/client";
import { isUuid } from "@/lib/utils/isUuid";
import { sortTimelineEvents } from "@/lib/utils/sortTimelineEvents";
import { formatYearWithAD } from "@/lib/utils/dateFormat";
import TimelinePageClient from "./TimelinePageClient";
import type { TimelineEvent } from "@/components/timeline/Timeline";

function formatEventWhenForSr(e: TimelineEvent): string {
  if (e.number !== undefined) {
    const label = e.numberLabel?.trim();
    return label ? `${label} ${e.number}` : `Event ${e.number}`;
  }
  if (e.year === undefined) return "";
  const y = formatYearWithAD(e.year, e.year <= 999);
  if (!e.month) return y;
  const monthName = new Date(e.year, e.month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
  });
  if (!e.day) return `${monthName} ${y}`;
  return `${monthName} ${e.day}, ${y}`;
}

function plainTextForSr(raw: string): string {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncateSrText(text: string, max = 500): string {
  const t = plainTextForSr(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/**
 * Server-loaded timeline + events for faster first paint and crawlable body summary.
 * Per-URL Open Graph tags live in ./layout.tsx (generateMetadata).
 */
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const timeline = isUuid(id)
    ? await getTimelineById(id)
    : await getTimelineBySlug(id);

  if (!timeline) {
    notFound();
  }

  const events = await getEventsByTimelineId(timeline.id);
  const initialEvents: TimelineEvent[] = events.map((e) =>
    transformApiEventToTimelineEvent(e as any)
  );

  const safeTimeline = JSON.parse(JSON.stringify(timeline)) as Record<string, unknown>;
  const desc = timeline.description?.trim();
  const eventsForSr = sortTimelineEvents(initialEvents);

  return (
    <>
      <section className="sr-only" aria-label="Timeline summary">
        <h1>{timeline.title}</h1>
        {desc ? <p>{desc}</p> : null}
        {eventsForSr.length > 0 ? (
          <>
            <h2>Events</h2>
            <ol aria-label="Timeline events in order">
              {eventsForSr.map((ev) => {
                const when = formatEventWhenForSr(ev);
                const body = ev.description?.trim()
                  ? truncateSrText(ev.description)
                  : null;
                return (
                  <li key={ev.id}>
                    <p>
                      {when ? (
                        <>
                          <span>{when}. </span>
                          {ev.title}
                        </>
                      ) : (
                        ev.title
                      )}
                    </p>
                    {body ? <p>{body}</p> : null}
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}
      </section>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        }
      >
        <TimelinePageClient
          initialTimeline={safeTimeline}
          initialEvents={initialEvents}
        />
      </Suspense>
    </>
  );
}
