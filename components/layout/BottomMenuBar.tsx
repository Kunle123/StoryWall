"use client";

import { Share2, Layers, Search, Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface BottomMenuBarProps {
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
}

export const BottomMenuBar = ({ viewMode, onViewModeChange }: BottomMenuBarProps) => {
  const { toast } = useToast();
  const router = useRouter();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "Timeline",
        text: "Check out this timeline",
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
      <div className="container mx-auto px-3 h-14 flex items-center justify-center max-w-4xl">
        <div className="flex items-center justify-evenly flex-1 max-w-md">
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push("/discover")}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push("/portfolio")}
          >
            <Folder className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-10 w-10"
            onClick={() => router.push("/editor")}
          >
            <Plus className="w-5 h-5" />
          </Button>
          {viewMode && onViewModeChange && (
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="icon"
              className="h-10 w-10"
              onClick={handleToggleView}
            >
              <Layers className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-10 w-10"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
