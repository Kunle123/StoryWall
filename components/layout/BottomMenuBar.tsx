"use client";

import { Share2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BottomMenuBarProps {
  title: string;
  dateRange?: string;
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
}

export const BottomMenuBar = ({ title, dateRange, viewMode, onViewModeChange }: BottomMenuBarProps) => {
  const { toast } = useToast();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this timeline: ${title}`,
        url: url,
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Timeline link copied to clipboard",
        });
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Timeline link copied to clipboard",
      });
    }
  };

  const handleToggleView = () => {
    if (onViewModeChange) {
      onViewModeChange(viewMode === "vertical" ? "hybrid" : "vertical");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 h-14 flex items-center justify-between max-w-4xl">
        <h2 className="font-display font-semibold text-base truncate flex-1">
          {title} {dateRange && <span className="text-muted-foreground">{dateRange}</span>}
        </h2>
        <div className="flex items-center gap-2">
          {viewMode && onViewModeChange && (
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              onClick={handleToggleView}
              className="gap-1.5 h-8"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">
                {viewMode === "vertical" ? "Hybrid" : "Vertical"}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="sm"
            onClick={handleShare}
            className="gap-1.5 h-8"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
