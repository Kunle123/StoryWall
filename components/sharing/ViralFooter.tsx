"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Copy } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface ViralFooterProps {
  timelineTitle?: string;
  timelineId?: string;
}

function footerUtmSearchParams(
  campaign: "viral_footer" | "viral_footer_cta",
  timelineId?: string
) {
  const p = new URLSearchParams({
    utm_source: "timeline",
    utm_medium: "footer",
    utm_campaign: campaign,
  });
  if (timelineId) p.set("utm_content", timelineId.slice(0, 8));
  return p.toString();
}

export function ViralFooter({ timelineTitle, timelineId }: ViralFooterProps) {
  const { toast } = useToast();

  const homeHref = `/?${footerUtmSearchParams("viral_footer", timelineId)}`;
  const signUpHref = `/sign-up?${footerUtmSearchParams("viral_footer_cta", timelineId)}`;

  async function copyPageLink() {
    try {
      const url =
        typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share this page with anyone.",
      });
    } catch {
      toast({
        title: "Could not copy",
        description: "Copy the address from your browser address bar.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mt-12 pt-8 pb-6 border-t border-border bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side: Value proposition */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Created with{" "}
                <Link
                  href={homeHref}
                  className="text-primary hover:underline underline-offset-2"
                >
                  StoryWall
                </Link>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Turn your stories into visual timelines—AI-assisted research and drafts, optional AI illustrations
            </p>
          </div>

          {/* Right side: Copy + CTA */}
          <div className="flex flex-col sm:flex-row flex-shrink-0 gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 whitespace-nowrap"
              onClick={() => void copyPageLink()}
            >
              <Copy className="w-4 h-4" />
              Copy link
            </Button>
            <Button
              asChild
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
              size="sm"
            >
              <Link href={signUpHref}>
                Create Your Own Timeline & Get 30 Free AI Image Credits
                <ArrowRight className="w-4 h-4" />
              </Link>
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

