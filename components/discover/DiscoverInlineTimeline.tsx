"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { Timeline, type TimelineEvent } from "@/components/timeline/Timeline";
import {
  fetchTimelineById,
  fetchEventsByTimelineId,
  transformApiEventToTimelineEvent,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type Props = {
  timelineId: string;
};

/**
 * Full timeline embedded in discover feed (GitHub #29).
 */
export function DiscoverInlineTimeline({ timelineId }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      const tr = await fetchTimelineById(timelineId);
      if (cancelled) return;
      if (!tr.data) {
        setErr(tr.error || "Failed to load story");
        setLoading(false);
        return;
      }
      setTimeline(tr.data as Record<string, unknown>);
      const tid = (tr.data as { id?: string }).id || timelineId;
      const ev = await fetchEventsByTimelineId(tid);
      if (cancelled) return;
      const raw = ev.data || [];
      let mapped = raw.map((e: unknown) => transformApiEventToTimelineEvent(e));
      if (
        mapped.length === 0 &&
        tr.data &&
        Array.isArray((tr.data as { events?: unknown[] }).events)
      ) {
        mapped = (tr.data as { events: unknown[] }).events.map((e) =>
          transformApiEventToTimelineEvent(e)
        );
      }
      setEvents(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [timelineId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
        Loading story…
      </div>
    );
  }

  if (err || !timeline) {
    return (
      <div className="text-center py-8 text-destructive text-sm px-2">
        {err || "Could not load this story."}
      </div>
    );
  }

  const tl = timeline as {
    id: string;
    title?: string;
    slug?: string;
  };
  const slugOrId = tl.slug || tl.id;

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-inner">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60 bg-muted/30">
        <span className="text-xs font-semibold text-foreground truncate pr-2">
          {tl.title || "Story"}
        </span>
        <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" asChild>
          <Link href={`/timeline/${encodeURIComponent(slugOrId)}`}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" aria-hidden />
            Full page
          </Link>
        </Button>
      </div>
      <div className="max-h-[min(75vh,920px)] overflow-y-auto overflow-x-hidden px-1 pt-2 pb-6">
        {events.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8 px-2">No events in this story yet.</p>
        ) : (
          <Timeline
            events={events}
            pixelsPerYear={30}
            viewMode="vertical"
            isEditable={false}
            timelineId={tl.id}
            timeline={tl}
          />
        )}
      </div>
    </div>
  );
}
