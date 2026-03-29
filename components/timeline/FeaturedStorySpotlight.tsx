"use client";

import { Card } from "@/components/ui/card";
import { Star, Heart, Share2 } from "lucide-react";
import { StoryWallDateBadges } from "@/components/discover/StoryWallDateBadges";

export type FeaturedStorySpotlightProps = {
  title: string;
  summary?: string;
  creatorName: string;
  creatorAvatar?: string;
  viewLabel: string;
  eventCount: number;
  likesCount?: number;
  sharesCount?: number;
  previewImages: string[];
  badgeTop?: string;
  badgeBottom?: string;
  isExpanded?: boolean;
  onClick: () => void;
};

/**
 * Featured strip — slightly elevated so creators feel spotlighted.
 */
export function FeaturedStorySpotlight({
  title,
  summary,
  creatorName,
  creatorAvatar,
  viewLabel,
  eventCount,
  likesCount = 0,
  sharesCount = 0,
  previewImages,
  badgeTop,
  badgeBottom,
  isExpanded = false,
  onClick,
}: FeaturedStorySpotlightProps) {
  const thumbs = previewImages.filter(Boolean).slice(0, 3);
  const showBadges = Boolean(badgeTop && badgeBottom);

  return (
    <Card
      className={`overflow-hidden cursor-pointer border-border/80 bg-gradient-to-br from-card via-muted/25 to-card shadow-sm hover:border-amber-500/35 hover:shadow-lg transition-all relative dark:via-primary/[0.03] ${
        isExpanded ? "ring-2 ring-primary/50 shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-1 bg-gradient-to-r from-amber-400/90 via-primary/80 to-violet-500/80" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Star className="w-3 h-3 fill-amber-500 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
            <span>
              <span aria-hidden>✦ </span>Creator spotlight
            </span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,5.5rem)_1fr] gap-4 sm:gap-5">
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 shrink-0">
            {creatorAvatar ? (
              <div className="relative w-[5.5rem] h-[5.5rem] rounded-full overflow-hidden border-[3px] border-amber-500/70 shadow-lg ring-2 ring-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creatorAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-[5.5rem] h-[5.5rem] rounded-full bg-muted border-[3px] border-amber-500/50 flex items-center justify-center text-2xl font-display shadow-lg ring-2 ring-background">
                {creatorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="font-semibold text-xl font-display leading-tight mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              By <strong className="text-foreground font-medium">{creatorName}</strong>
            </p>
            {summary && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-0 border-l-2 border-amber-500/45 pl-3 italic sm:max-w-prose mx-auto sm:mx-0">
                {summary}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/35 dark:bg-muted/25 p-3 relative">
          {showBadges && (
            <div className="absolute left-3 top-3 z-10">
              <StoryWallDateBadges top={badgeTop!} bottom={badgeBottom!} />
            </div>
          )}
          <div className="flex gap-1.5 justify-center sm:justify-start mb-2 min-h-[2.75rem] items-end">
            {thumbs.map((url, i) => (
              <div
                key={url + i}
                className="relative w-[3.25rem] h-[3.25rem] rounded-md overflow-hidden border border-border/80 bg-muted shadow-sm opacity-[calc(1-0.12*i)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              {eventCount} event{eventCount === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span>{viewLabel} views</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5" title="Likes">
              <Heart className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
              {likesCount}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5" title="Shares">
              <Share2 className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
              {sharesCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
