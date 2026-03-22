"use client";

import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export type FeaturedStorySpotlightProps = {
  title: string;
  summary?: string;
  creatorName: string;
  creatorAvatar?: string;
  viewLabel: string;
  eventCount: number;
  previewImages: string[];
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
  previewImages,
  onClick,
}: FeaturedStorySpotlightProps) {
  const thumbs = previewImages.filter(Boolean).slice(0, 3);

  return (
    <Card
      className="overflow-hidden cursor-pointer border-primary/25 hover:border-primary/40 hover:shadow-lg transition-all relative"
      onClick={onClick}
    >
      <div className="h-1 bg-gradient-to-r from-amber-400/90 via-primary/80 to-violet-500/80" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Featured
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 shrink-0">
            {creatorAvatar ? (
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400/60 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creatorAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted border-2 border-amber-400/40 flex items-center justify-center text-lg font-display">
                {creatorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:flex gap-1.5 items-end">
              {thumbs.map((url, i) => (
                <div
                  key={url + i}
                  className="relative w-11 h-11 rounded-md overflow-hidden border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg font-display leading-tight mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              By <strong className="text-foreground font-medium">{creatorName}</strong>
              <span className="text-muted-foreground/80"> · Featured on StoryWall</span>
            </p>
            {summary && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3 border-l-2 border-amber-400/50 pl-3">
                {summary}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                {eventCount} event{eventCount === 1 ? "" : "s"}
              </span>
              <span>·</span>
              <span>{viewLabel} views</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
