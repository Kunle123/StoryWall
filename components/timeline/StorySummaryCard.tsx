"use client";

import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";

export type StorySummaryCardProps = {
  title: string;
  summary?: string;
  creatorName: string;
  viewLabel: string;
  eventCount: number;
  previewImages: string[];
  topicLabel?: string;
  onClick: () => void;
};

/**
 * Compact card for home / discover: scan title + summary + meta before opening timeline.
 */
export function StorySummaryCard({
  title,
  summary,
  creatorName,
  viewLabel,
  eventCount,
  previewImages,
  topicLabel,
  onClick,
}: StorySummaryCardProps) {
  const thumbs = previewImages.filter(Boolean).slice(0, 3);
  const filler = 3 - thumbs.length;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/25 transition-all group h-full flex flex-col"
      onClick={onClick}
    >
      <div className="h-[5.5rem] bg-muted/80 flex items-end gap-1.5 px-2 pb-2 shrink-0 border-b border-border/40">
        {thumbs.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative w-12 h-12 rounded-md overflow-hidden border border-border/60 bg-muted shrink-0 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {filler > 0 &&
          Array.from({ length: filler }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 rounded-md border border-dashed border-border/60 bg-background/80 flex items-center justify-center shrink-0"
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
        <div className="text-[0.7rem] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-auto pt-1 border-t border-border/30">
          <span className="truncate max-w-[45%]">{creatorName}</span>
          <span aria-hidden>·</span>
          <span>
            {eventCount} event{eventCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>{viewLabel} views</span>
        </div>
      </div>
    </Card>
  );
}
