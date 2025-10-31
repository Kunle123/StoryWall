"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TimelineEvent } from "./Timeline";
import { Image, Video, Share2, Heart, Bookmark, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineCardProps {
  event: TimelineEvent;
  side: "left" | "right";
  isStacked?: boolean;
  stackDepth?: number;
  isHighlighted?: boolean;
}

export const TimelineCard = ({ event, side, isStacked = false, stackDepth = 0, isHighlighted = false }: TimelineCardProps) => {
  const router = useRouter();
  
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

  return (
    <Card
      onClick={() => router.push(`/story/${event.id}`)}
      className={`p-4 transition-all duration-200 cursor-pointer bg-card border-y border-x-0 rounded-none hover:bg-muted/30 ${
        isHighlighted ? "bg-muted/50" : ""
      }`}
    >
      <div className="space-y-3">
        {/* Header with category and date */}
        <div className="flex items-center justify-between">
          {event.category && (
            <span className="text-[13px] font-semibold text-orange-500">
              {event.category.toUpperCase()}
            </span>
          )}
          <span className="text-[13px] text-muted-foreground">
            {formatDate(event.year, event.month, event.day)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[15px] leading-tight">{event.title}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-[15px] text-foreground/90 leading-normal">{event.description}</p>
        )}

        {/* Image display */}
        {event.image && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Video indicator */}
        {event.video && (
          <div className="flex gap-2 pt-1">
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
              <Video className="w-4 h-4" />
              <span>Video</span>
            </div>
          </div>
        )}

        {/* Social and sharing icons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="h-8 px-2 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                // Handle like action
              }}
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="h-8 px-2 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                // Handle comment action
              }}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="h-8 px-2 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                // Handle bookmark action
              }}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="sm"
            className="h-8 px-2 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              // Handle share action
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
