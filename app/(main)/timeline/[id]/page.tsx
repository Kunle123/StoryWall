import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTimelineById, getTimelineBySlug } from "@/lib/db/timelines";
import { getEventsByTimelineId } from "@/lib/db/events";
import { transformApiEventToTimelineEvent } from "@/lib/api/client";
import { isUuid } from "@/lib/utils/isUuid";
import TimelinePageClient from "./TimelinePageClient";
import type { TimelineEvent } from "@/components/timeline/Timeline";

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

  return (
    <>
      <section className="sr-only" aria-label="Timeline summary">
        <h1>{timeline.title}</h1>
        {desc ? <p>{desc}</p> : null}
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
