"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Timeline, type TimelineEvent } from "@/components/timeline/Timeline";
import {
  fetchTimelineById,
  fetchEventsByTimelineId,
  transformApiEventToTimelineEvent,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  timelineId: string;
  /** Optional date span chip (e.g. year range) — square chip, no event count */
  badgePeriod?: string;
  /** Title line for the primary strip (truncated title — no event count) */
  titleLine?: string;
  /** Collapse inline timeline (discover feed) */
  onClose?: () => void;
};

/**
 * Full timeline embedded in discover feed (GitHub #29).
 * Primary strip: date (optional) + title + close. Scroll region has halo border.
 */
export function DiscoverInlineTimeline({
  timelineId,
  badgePeriod,
  titleLine,
  onClose,
}: Props) {
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
  const storyTitle = (tl.title && String(tl.title).trim()) || "Story";
  const headline = (titleLine && titleLine.trim()) || storyTitle;

  return (
    <div className="rounded-none border-0 bg-card/60 overflow-hidden shadow-inner motion-reduce:animate-none">
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 px-3 py-2.5 sm:py-3 border-b border-primary/25",
          "bg-primary text-primary-foreground"
        )}
      >
        {badgePeriod && (
          <span className="text-[0.65rem] font-bold uppercase tracking-wide shrink-0 bg-primary-foreground/15 px-2 py-1 border border-primary-foreground/25 rounded-none">
            {badgePeriod}
          </span>
        )}
        <p className="flex-1 min-w-0 text-sm sm:text-[0.95rem] font-semibold leading-snug font-display line-clamp-3">
          {headline}
        </p>
        {onClose && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-none border border-border bg-background text-foreground shadow-sm hover:bg-muted shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close timeline"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "max-h-[min(75vh,920px)] overflow-y-auto overflow-x-hidden px-1 pt-2 pb-6 mx-1 my-2 rounded-sm",
          "border-2 border-primary/50",
          "ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
          "shadow-[0_0_22px_hsl(var(--primary)/0.22)]",
          "bg-background/40 dark:bg-background/20"
        )}
      >
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
