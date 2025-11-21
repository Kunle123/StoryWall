"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

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
  const { isSignedIn } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const tweetText = `${title}\n\n${description}\n\n${timelineUrl}`;

  // Check Twitter connection status
  useEffect(() => {
    if (isSignedIn && imageUrl) {
      setIsChecking(true);
      fetch('/api/twitter/status')
        .then(res => res.json())
        .then(data => {
          setIsConnected(data.connected || false);
        })
        .catch(() => setIsConnected(false))
        .finally(() => setIsChecking(false));
    }
  }, [isSignedIn, imageUrl]);

  const handleCopyTweet = () => {
    navigator.clipboard.writeText(tweetText);
    toast({
      title: "Tweet copied!",
      description: "Tweet text has been copied to clipboard",
    });
  };

  const handleConnectTwitter = async () => {
    try {
      const response = await fetch('/api/twitter/oauth');
      if (!response.ok) {
        throw new Error('Failed to initiate Twitter connection');
      }
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Twitter",
        variant: "destructive",
      });
    }
  };

  const handleShareOnTwitter = async () => {
    // If image is present and user is connected, use API to post with image
    if (imageUrl && isSignedIn && isConnected) {
      setIsPosting(true);
      try {
        const response = await fetch('/api/twitter/post-tweet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: tweetText,
            imageUrl: imageUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.error?.includes('not connected')) {
            setIsConnected(false);
            toast({
              title: "Twitter not connected",
              description: "Please connect your Twitter account to post with image",
              variant: "destructive",
            });
            return;
          }
          throw new Error(error.error || 'Failed to post tweet');
        }

        const result = await response.json();
        toast({
          title: "Success!",
          description: "Tweet posted with image attached",
        });

        if (result.tweetUrl) {
          window.open(result.tweetUrl, '_blank');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to post tweet",
          variant: "destructive",
        });
      } finally {
        setIsPosting(false);
      }
    } else {
      // Fallback to intent URL (no image support)
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tweet Preview</h3>
        <p className="text-sm text-muted-foreground">
          Ready to share on Twitter/X
        </p>
      </div>

      {/* Image with StoryWall branding */}
      {imageUrl && (
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
      )}

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
      <div className="flex flex-col gap-2">
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
            disabled={isPosting || isChecking}
            className="flex-1 gap-2"
          >
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                {imageUrl && isSignedIn && isConnected ? "Post on X" : "Share on X"}
              </>
            )}
          </Button>
        </div>
        
        {/* Twitter connection status */}
        {imageUrl && isSignedIn && (
          <div className="text-xs text-muted-foreground">
            {isChecking ? (
              "Checking Twitter connection..."
            ) : isConnected ? (
              "✓ Connected - Image will be attached when posting"
            ) : (
              <div className="flex items-center gap-2">
                <span>⚠️ Not connected - Image won't be attached</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleConnectTwitter}
                  className="h-auto p-0 text-xs"
                >
                  Connect Twitter
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      <p className="text-xs text-muted-foreground text-center">
        Characters: {tweetText.length}/280
      </p>
    </Card>
  );
};

