"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TimelineEvent } from "./Timeline";
import { Image, Video } from "lucide-react";

interface TimelineCardProps {
  event: TimelineEvent;
  side: "left" | "right";
  isStacked?: boolean;
  stackDepth?: number;
  isHighlighted?: boolean;
}

export const TimelineCard = ({ event, side, isStacked = false, stackDepth = 0, isHighlighted = false }: TimelineCardProps) => {
  const formatDate = (year: number, month?: number, day?: number) => {
    if (day && month) {
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (month) {
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    }
    return year.toString();
  };

  const truncateText = (text: string, maxLength: number = 240) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <Link href={`/story/${event.id}`}>
      <Card
        className={`p-4 transition-all duration-300 cursor-pointer animate-fade-in bg-card border-l-4 group ${
          event.category === "vehicle"
            ? "border-l-primary"
            : event.category === "crisis"
            ? "border-l-destructive"
            : "border-l-accent"
        } ${
          isStacked 
            ? "hover:scale-105 hover:shadow-2xl" 
            : "shadow-lg hover:shadow-2xl"
        } ${
          isHighlighted 
            ? event.category === "vehicle"
              ? "ring-4 ring-primary/50 shadow-2xl scale-105"
              : event.category === "crisis"
              ? "ring-4 ring-destructive/50 shadow-2xl scale-105"
              : "ring-4 ring-accent/50 shadow-2xl scale-105"
            : ""
        }`}
      >
        <div className="space-y-2 relative">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-base leading-tight">{event.title}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {formatDate(event.year, event.month, event.day)}
            </span>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{truncateText(event.description)}</p>
          )}
          <div className="flex items-center justify-between">
            {event.category && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  event.category === "vehicle"
                    ? "bg-primary/10 text-primary"
                    : event.category === "crisis"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {event.category}
              </span>
            )}
            {/* Multimedia indicators */}
            {(event.image || event.video) && (
              <div className="flex gap-1 ml-auto">
                {event.image && (
                  <div className="p-1 rounded bg-primary/10">
                    <Image className="w-3 h-3 text-primary" />
                  </div>
                )}
                {event.video && (
                  <div className="p-1 rounded bg-primary/10">
                    <Video className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

