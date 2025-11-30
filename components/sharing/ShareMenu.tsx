"use client";

import { useState } from "react";
import { Copy, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

interface ShareMenuProps {
  /** Trigger element (button) */
  trigger: ReactNode;
  /** URL to share */
  url?: string;
  /** Title for the share */
  title?: string;
  /** Whether to show Twitter share option */
  showTwitter?: boolean;
  /** Callback when Twitter share is clicked */
  onTwitterShare?: () => void;
  /** Popover alignment */
  align?: "start" | "center" | "end";
  /** Popover side */
  side?: "top" | "bottom" | "left" | "right";
}

export function ShareMenu({
  trigger,
  url,
  title,
  showTwitter = false,
  onTwitterShare,
  align = "end",
  side = "top",
}: ShareMenuProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "Timeline",
          text: `Check out this timeline: ${title || ""}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
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
          await navigator.clipboard.writeText(shareUrl);
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
    setOpen(false);
  };

  const handleTwitterShare = () => {
    setOpen(false);
    if (onTwitterShare) {
      onTwitterShare();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align={align} side={side}>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          {showTwitter && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleTwitterShare}
            >
              <Twitter className="h-4 w-4" />
              Share on X/Twitter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

