"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Twitter, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { formatTimelineAsTwitterThread, formatTweetsAsThreadString, copyThreadToClipboard } from "@/lib/utils/twitterThread";
import { TimelineEvent } from "./Timeline";

interface TwitterThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineTitle: string;
  timelineDescription?: string;
  events: TimelineEvent[];
  timelineUrl?: string;
  timelineImageUrl?: string; // First event's image URL for Twitter card
}

export function TwitterThreadDialog({
  open,
  onOpenChange,
  timelineTitle,
  timelineDescription,
  events,
  timelineUrl,
  timelineImageUrl,
}: TwitterThreadDialogProps) {
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const [copied, setCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const tweets = formatTimelineAsTwitterThread(
    timelineTitle,
    timelineDescription,
    events,
    timelineUrl,
    timelineImageUrl
  );
  
  const threadText = formatTweetsAsThreadString(tweets);
  
  const handleCopy = async () => {
    const success = await copyThreadToClipboard(tweets);
    if (success) {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Twitter thread copied to clipboard. Paste each tweet in order on Twitter.",
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying manually",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenTwitter = () => {
    // Open Twitter compose with first tweet
    const firstTweet = tweets[0]?.text || '';
    const encodedText = encodeURIComponent(firstTweet);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
  };
  
  const checkTwitterConnection = async () => {
    try {
      const response = await fetch('/api/twitter/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
      }
    } catch (error) {
      setIsConnected(false);
    }
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
  
  const handlePostThread = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post threads automatically",
        variant: "destructive",
      });
      return;
    }
    
    setIsPosting(true);
    try {
      const response = await fetch('/api/twitter/post-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweets: tweets.map(t => ({ text: t.text })),
          imageUrl: timelineImageUrl, // Include image URL for first tweet
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes('not connected')) {
          setIsConnected(false);
          toast({
            title: "Twitter not connected",
            description: "Please connect your Twitter account first",
            variant: "destructive",
          });
        } else {
          throw new Error(error.error || 'Failed to post thread');
        }
        return;
      }
      
      const result = await response.json();
      toast({
        title: "Success!",
        description: `Posted ${result.tweetsPosted} tweets to Twitter`,
      });
      
      if (result.threadUrl) {
        window.open(result.threadUrl, '_blank');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post thread",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };
  
  // Check connection status when dialog opens
  useEffect(() => {
    if (open && isSignedIn) {
      checkTwitterConnection();
    }
  }, [open, isSignedIn]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share as Twitter Thread</DialogTitle>
          <DialogDescription>
            Copy this thread and post each tweet in order on Twitter. The thread contains {tweets.length} tweet{tweets.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Thread Preview</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenTwitter}
                  className="gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Open Twitter
                </Button>
                {isSignedIn && (
                  isConnected ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePostThread}
                      disabled={isPosting}
                      className="gap-2"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Twitter className="w-4 h-4" />
                          Post Thread
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleConnectTwitter}
                      className="gap-2"
                    >
                      <Twitter className="w-4 h-4" />
                      Connect Twitter
                    </Button>
                  )
                )}
              </div>
            </div>
            <Textarea
              value={threadText}
              readOnly
              className="font-mono text-sm min-h-[400px]"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">How to post:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click "Copy All" to copy the entire thread</li>
              <li>Go to Twitter and compose a new tweet</li>
              <li>Paste the first tweet (marked as "1/n") and post it</li>
              <li>Reply to your first tweet with the second tweet (marked as "2/n")</li>
              <li>Continue replying to each previous tweet with the next one in sequence</li>
            </ol>
          </div>
          
          <div className="flex gap-2">
            {tweets.map((tweet, index) => (
              <div key={index} className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Tweet {index + 1} ({tweet.text.length}/280)
                </div>
                <Textarea
                  value={tweet.text}
                  readOnly
                  className="font-mono text-xs h-24"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

