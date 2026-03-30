"use client";

import { Card } from "@/components/ui/card";
import { Star, Heart, Share2 } from "lucide-react";

export type FeaturedStorySpotlightProps = {
  title: string;
  summary?: string;
  creatorName: string;
  creatorAvatar?: string;
  viewLabel: string;
  likesCount?: number;
  sharesCount?: number;
  previewImages: string[];
  badgeTop?: string;
  badgeBottom?: string;
  onClick: () => void;
};

export function FeaturedStorySpotlight({
  title,
  summary,
  creatorName,
  creatorAvatar,
  viewLabel,
  likesCount = 0,
  sharesCount = 0,
  previewImages,
  badgeTop,
  badgeBottom,
  onClick,
}: FeaturedStorySpotlightProps) {
  const thumbs = previewImages.filter(Boolean).slice(0, 3);
  const showLabels = Boolean(badgeTop && badgeBottom);
  const headline = showLabels ? badgeBottom : title;

  return (
    <Card
      className={[
        "overflow-hidden cursor-pointer rounded-none transition-all duration-200",
        "border-2 border-amber-400/35 dark:border-amber-500/35",
        "bg-gradient-to-b from-amber-50/90 via-background to-background",
        "dark:from-amber-950/30 dark:via-card dark:to-card",
        "shadow-sm shadow-amber-500/10",
        "hover:border-amber-500/45 hover:shadow-md hover:shadow-amber-500/15",
      ].join(" ")}
      onClick={onClick}
    >
      <div className="h-1.5 bg-gradient-to-r from-amber-300/90 via-primary/75 to-amber-400/70 dark:from-amber-500/50 dark:via-primary/70 dark:to-amber-600/40" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-500/20 dark:bg-amber-500/15 px-2 py-0.5 rounded-none border border-amber-500/30 dark:border-amber-400/25">
            <Star className="w-3 h-3 fill-amber-500 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
            <span>
              <span aria-hidden>✦ </span>Creator spotlight
            </span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,5.5rem)_1fr] gap-4 sm:gap-5">
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 shrink-0">
            {creatorAvatar ? (
              <div className="relative w-[5.5rem] h-[5.5rem] rounded-full overflow-hidden border-[3px] border-amber-400/80 dark:border-amber-500/60 shadow-md ring-2 ring-amber-100/80 dark:ring-amber-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creatorAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-[5.5rem] h-[5.5rem] rounded-full bg-amber-50 dark:bg-amber-950/40 border-[3px] border-amber-400/70 dark:border-amber-500/50 flex items-center justify-center text-2xl font-display shadow-md ring-2 ring-amber-100/80 dark:ring-amber-950/50">
                {creatorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-sm text-muted-foreground mb-2">
              By <strong className="text-foreground font-medium">{creatorName}</strong>
            </p>
            {summary && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-0 border-l-2 border-amber-500/50 dark:border-amber-500/40 pl-3 italic sm:max-w-prose mx-auto sm:mx-0">
                {summary}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 w-full border border-primary/35 bg-primary text-primary-foreground px-3 py-2.5 sm:py-3">
          <p className="text-lg font-semibold leading-tight font-display line-clamp-3">{headline}</p>
        </div>

        <div className="mt-0 rounded-none border border-t-0 border-amber-200/60 dark:border-amber-800/45 bg-amber-50/60 dark:bg-amber-950/25 p-3 relative">
          {badgeTop && (
            <div className="absolute left-4 top-4 z-10 pointer-events-none max-w-[min(92%,14rem)]">
              <span className="inline-block px-2 py-1 bg-primary text-primary-foreground text-[0.62rem] font-bold uppercase tracking-wide leading-tight rounded-none shadow-md">
                {badgeTop}
              </span>
            </div>
          )}
          <div className="flex gap-1.5 justify-center sm:justify-start mb-2 min-h-[2.75rem] items-end pt-1">
            {thumbs.map((url, i) => (
              <div
                key={url + i}
                className="relative w-[3.25rem] h-[3.25rem] rounded-none overflow-hidden border border-amber-200/80 dark:border-amber-800/50 bg-muted shadow-sm opacity-[calc(1-0.12*i)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
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
