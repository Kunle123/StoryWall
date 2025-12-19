"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ViralFooterProps {
  timelineTitle?: string;
  timelineId?: string;
}

export function ViralFooter({ timelineTitle, timelineId }: ViralFooterProps) {
  const router = useRouter();

  return (
    <div className="mt-12 pt-8 pb-6 border-t border-border bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side: Value proposition */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Created with Storywall
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Turn your stories into beautiful visual timelines with AI-generated images
            </p>
          </div>

          {/* Right side: CTA button */}
          <div className="flex-shrink-0">
            <Button
              onClick={() => router.push('/sign-up')}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
              size="sm"
            >
              Create Your Own Timeline & Get 30 Free AI Image Credits
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Optional: Social proof or stats */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>✨ 30 free AI image credits</span>
            <span>•</span>
            <span>📸 1 token = 1 AI image</span>
            <span>•</span>
            <span>🚀 Create in minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

