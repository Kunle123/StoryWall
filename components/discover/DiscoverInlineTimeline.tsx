"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, X } from "lucide-react";
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
  /** Top badge line (e.g. year range) — matches StoryWallDateBadges */
  badgePeriod?: string;
  /** Bottom badge line (e.g. "19 events · Title…") — inverted headline in expanded view */
  badgeSubtitle?: string;
  /** Collapse inline timeline (discover feed) */
  onClose?: () => void;
};

/**
 * Full timeline embedded in discover feed (GitHub #29).
 * When badgeSubtitle is set, it replaces the default title row with an inverted primary bar.
 */
export function DiscoverInlineTimeline({
  timelineId,
  badgePeriod,
  badgeSubtitle,
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
  const slugOrId = tl.slug || tl.id;
  const storyTitle = (tl.title && String(tl.title).trim()) || "Story";
  /** Prefer badge line as main headline when provided (matches summary card lower label) */
  const headline = badgeSubtitle?.trim() || storyTitle;
  const showStoryTitleSub =
    Boolean(badgeSubtitle?.trim()) &&
    Boolean(storyTitle) &&
    badgeSubtitle!.trim() !== storyTitle;

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-inner motion-reduce:animate-none">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          {badgePeriod && (
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0 border border-primary/20">
              {badgePeriod}
            </span>
          )}
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Full timeline
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onClose && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full border border-border shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close timeline"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" asChild>
            <Link href={`/timeline/${encodeURIComponent(slugOrId)}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" aria-hidden />
              Full page
            </Link>
          </Button>
        </div>
      </div>

      {/* Inverted headline: same copy as badge bottom on summary card — stands out from body */}
      <div
        className={cn(
          "px-3 py-3 sm:py-3.5 border-b border-primary/25",
          "bg-primary text-primary-foreground",
          "motion-reduce:transition-none"
        )}
      >
        <p className="text-sm sm:text-[0.95rem] font-semibold leading-snug font-display line-clamp-4">
          {headline}
        </p>
        {showStoryTitleSub && (
          <p className="text-xs text-primary-foreground/85 mt-1.5 line-clamp-2 font-medium">
            {storyTitle}
          </p>
        )}
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
