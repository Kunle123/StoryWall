"use client";

import { Card } from "@/components/ui/card";
import { Eye, Heart, Share2 } from "lucide-react";
import { StoryWallDateBadges } from "@/components/discover/StoryWallDateBadges";

export type StorySummaryCardProps = {
  title: string;
  summary?: string;
  creatorName: string;
  /** Creator profile image URL (e.g. avatar_url or generated fallback) */
  creatorAvatar?: string;
  likesCount?: number;
  sharesCount?: number;
  viewLabel: string;
  eventCount: number;
  previewImages: string[];
  topicLabel?: string;
  /** Stacked date/period labels on the image strip (discover feed). */
  badgeTop?: string;
  badgeBottom?: string;
  isExpanded?: boolean;
  onClick: () => void;
};

/**
 * Compact card for home / discover: scan title + summary + meta before opening timeline.
 */
export function StorySummaryCard({
  title,
  summary,
  creatorName,
  creatorAvatar,
  likesCount = 0,
  sharesCount = 0,
  viewLabel,
  eventCount,
  previewImages,
  topicLabel,
  badgeTop,
  badgeBottom,
  isExpanded = false,
  onClick,
}: StorySummaryCardProps) {
  const thumbs = previewImages.filter(Boolean).slice(0, 3);
  const filler = 3 - thumbs.length;
  const showBadges = Boolean(badgeTop && badgeBottom);

  return (
    <Card
      className={`overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group h-full flex flex-col hover:-translate-y-0.5 ${
        isExpanded ? "ring-2 ring-primary/45 shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative h-28 bg-gradient-to-br from-muted/90 via-muted to-primary/[0.08] dark:from-muted dark:via-primary/[0.06] dark:to-violet-950/30 flex items-stretch gap-1.5 px-2 py-2 shrink-0 border-b border-border/40">
        {showBadges && (
          <div className="absolute left-2 top-2 z-10">
            <StoryWallDateBadges top={badgeTop!} bottom={badgeBottom!} />
          </div>
        )}
        {thumbs.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative min-h-0 min-w-0 flex-1 rounded-md overflow-hidden border border-border/60 bg-muted shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        {filler > 0 &&
          Array.from({ length: filler }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-0 min-w-0 flex-1 rounded-md border border-dashed border-border/60 bg-background/80 flex items-center justify-center"
            >
              <Eye className="w-4 h-4 text-muted-foreground/50" />
            </div>
          ))}
      </div>
      <div className="p-3.5 flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 font-display group-hover:text-primary transition-colors">
            {title}
          </h3>
          {topicLabel && (
            <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap shrink-0 max-w-[5.5rem] truncate">
              {topicLabel}
            </span>
          )}
        </div>
        {summary && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-3 flex-1">
            {summary}
          </p>
        )}
        <div className="text-[0.7rem] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-auto pt-1 border-t border-border/30">
          <span className="inline-flex items-center gap-1.5 min-w-0 max-w-[min(100%,14rem)]">
            {creatorAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={creatorAvatar}
                alt=""
                aria-hidden
                title={creatorName}
                className="w-6 h-6 rounded-full object-cover border border-border/50 shrink-0 bg-muted"
              />
            ) : (
              <span
                className="w-6 h-6 rounded-full bg-muted border border-border/50 shrink-0 flex items-center justify-center text-[0.55rem] font-medium text-muted-foreground"
                aria-hidden
              >
                {creatorName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate">{creatorName}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            {eventCount} event{eventCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>{viewLabel} views</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5" title="Likes">
            <Heart className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
            {likesCount}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5" title="Shares">
            <Share2 className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
            {sharesCount}
          </span>
        </div>
      </div>
    </Card>
  );
}
