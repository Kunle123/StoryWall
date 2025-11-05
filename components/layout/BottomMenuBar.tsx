"use client";

import { Share2, Layers, Home, Plus, Folder } from "lucide-react";
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

  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title || "Timeline";
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this timeline: ${title}`,
          url: url,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Timeline link copied to clipboard",
        });
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Timeline link copied to clipboard",
          });
        } catch (clipboardError) {
          toast({
            title: "Failed to share",
            description: "Please try copying the link manually",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleToggleView = () => {
    if (onViewModeChange) {
      onViewModeChange(viewMode === "vertical" ? "hybrid" : "vertical");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ height: '44px' }}>
      <div className="container mx-auto px-3 h-full flex items-center justify-center max-w-4xl">
        <div className="flex items-center justify-evenly flex-1 max-w-md">
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/")}
          >
            <Home className="w-[18px] h-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/portfolio")}
          >
            <Folder className="w-[18px] h-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/editor")}
          >
            <Plus className="w-[18px] h-[18px]" />
          </Button>
          {viewMode && onViewModeChange && (
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleView}
            >
              <Layers className="w-[18px] h-[18px]" />
            </Button>
          )}
          <Button
            variant="ghost"
            // @ts-ignore - Type inference issue with class-variance-authority
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
          >
            <Share2 className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
};
