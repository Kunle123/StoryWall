"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimelineTweetTemplateProps {
  title: string;
  description: string;
  imageUrl: string;
  timelineUrl: string;
}

export const TimelineTweetTemplate = ({
  title,
  description,
  imageUrl,
  timelineUrl,
}: TimelineTweetTemplateProps) => {
  const { toast } = useToast();

  const tweetText = `${title}\n\n${description}\n\n${timelineUrl}`;

  const handleCopyTweet = () => {
    navigator.clipboard.writeText(tweetText);
    toast({
      title: "Tweet copied!",
      description: "Tweet text has been copied to clipboard",
    });
  };

  const handleShareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <Card className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tweet Preview</h3>
        <p className="text-sm text-muted-foreground">
          Ready to share on Twitter/X
        </p>
      </div>

      {/* Image with StoryWall branding */}
      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border border-border">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* StoryWall branding overlay */}
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">SW</span>
          </div>
        </div>
      </div>

      {/* Tweet text */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Tweet text:</p>
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-sm whitespace-pre-wrap pt-2">{description}</p>
          <div className="pt-2">
            <a
              href={timelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline block"
            >
              {timelineUrl}
            </a>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCopyTweet}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy Tweet
        </Button>
        <Button
          onClick={handleShareOnTwitter}
          className="flex-1 gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share on X
        </Button>
      </div>

      {/* Character count */}
      <p className="text-xs text-muted-foreground text-center">
        Characters: {tweetText.length}/280
      </p>
    </Card>
  );
};

