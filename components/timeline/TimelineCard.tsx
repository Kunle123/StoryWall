"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TimelineEvent } from "./Timeline";
import { Video, Share2, Heart, Bookmark, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/utils/dateFormat";

interface TimelineCardProps {
  event: TimelineEvent;
  side: "left" | "right";
  isStacked?: boolean;
  stackDepth?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isCentered?: boolean;
}

export const TimelineCard = ({ event, side, isStacked = false, stackDepth = 0, isHighlighted = false, isSelected = false, isCentered = false }: TimelineCardProps) => {
  const router = useRouter();
  const [stats, setStats] = useState({ likes: 0, comments: 0, shares: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/events/${event.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch event stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (event.id) {
      fetchStats();
    }
  }, [event.id]);
  
  const formatDate = (year: number, month?: number, day?: number) => {
    return formatEventDate(year, month, day);
  };

  return (
    <Card
      onClick={() => router.push(`/story/${event.id}`)}
      className={`p-4 transition-all duration-200 cursor-pointer bg-card border-y border-x-0 rounded-none hover:bg-muted/30 relative ${
        isHighlighted ? "bg-muted/50" : ""
      }`}
    >
      {/* Selected indicator dot */}
      {isSelected && (
        <div 
          className="absolute top-2 left-2 w-3 h-[5px] bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" 
          style={{ 
            animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 1'
          }} 
        />
      )}
      
      {/* Centered indicator dot */}
      {isCentered && (
        <div 
          className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full z-10 animate-[pulse_3s_ease-in-out_infinite]" 
        />
      )}
      <div className="space-y-3">
        {/* Date - shown on mobile, hidden on desktop (where it's in margin) */}
        <div className="text-xs font-medium text-muted-foreground md:hidden">
          {formatDate(event.year, event.month, event.day)}
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-[15px] leading-tight text-orange-500">{event.title}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-[15px] text-foreground/90 leading-normal font-light">
            {event.description.length > 240 
              ? `${event.description.substring(0, 240)}...` 
              : event.description}
          </p>
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
              size="sm"
              className="h-8 px-2 hover:bg-muted gap-1"
              onClick={(e) => {
                e.stopPropagation();
                // Handle like action
              }}
            >
              <Heart className="w-4 h-4" />
              {!loadingStats && <span className="text-xs text-muted-foreground">{stats.likes}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-muted gap-1"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/story/${event.id}#comments`);
              }}
            >
              <MessageCircle className="w-4 h-4" />
              {!loadingStats && <span className="text-xs text-muted-foreground">{stats.comments}</span>}
            </Button>
            <Button
              variant="ghost"
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
            size="sm"
            className="h-8 px-2 hover:bg-muted gap-1"
            onClick={(e) => {
              e.stopPropagation();
              // Handle share action
            }}
          >
            <Share2 className="w-4 h-4" />
            {!loadingStats && <span className="text-xs text-muted-foreground">{stats.shares}</span>}
          </Button>
        </div>
      </div>
    </Card>
  );
};
