import { Share2, Layers, Home, Plus, Folder } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface BottomMenuBarProps {
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
}

export const BottomMenuBar = ({ viewMode, onViewModeChange }: BottomMenuBarProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ height: '44px' }}>
      <div className="container mx-auto px-3 h-full flex items-center justify-center max-w-4xl">
        <div className="flex items-center justify-evenly flex-1 max-w-md">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/discover")}
          >
            <Home className="w-[18px] h-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/portfolio")}
          >
            <Folder className="w-[18px] h-[18px]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/timeline-editor")}
          >
            <Plus className="w-[18px] h-[18px]" />
          </Button>
          {viewMode && onViewModeChange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleView}
            >
              <Layers className="w-[18px] h-[18px]" />
            </Button>
          )}
          <Button
            variant="ghost"
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
