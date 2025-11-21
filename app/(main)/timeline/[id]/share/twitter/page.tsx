"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Copy, Twitter, Check, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchTimelineById, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { formatTimelineAsTwitterThread, formatTweetsAsThreadString, copyThreadToClipboard } from "@/lib/utils/twitterThread";
import { TimelineTweetTemplate } from "@/components/timeline/TimelineTweetTemplate";

export default function TwitterSharePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const timelineData = await fetchTimelineById(timelineId);
        if (timelineData.error) {
          toast({
            title: "Error",
            description: timelineData.error,
            variant: "destructive",
          });
          router.push(`/timeline/${timelineId}`);
          return;
        }
        setTimeline(timelineData.data);

        const eventsData = await fetchEventsByTimelineId(timelineId);
        if (eventsData.error) {
          console.error("Error fetching events:", eventsData.error);
        } else if (eventsData.data) {
          setEvents(eventsData.data.map((e: any) => transformApiEventToTimelineEvent(e)));
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
        toast({
          title: "Error",
          description: "Failed to load timeline",
          variant: "destructive",
        });
        router.push(`/timeline/${timelineId}`);
      } finally {
        setLoading(false);
      }
    };

    if (timelineId) {
      loadTimeline();
    }
  }, [timelineId, router, toast]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!isSignedIn) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/twitter/status");
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected || false);
        }
      } catch (error) {
        console.error("Error checking Twitter connection:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [isSignedIn]);

  if (loading || !timeline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const timelineUrl = typeof window !== 'undefined' ? `${window.location.origin}/timeline/${timelineId}` : '';
  const timelineImageUrl = events.length > 0 && events[0]?.image ? events[0].image : (timeline.events?.[0]?.image_url || undefined);

  const tweets = formatTimelineAsTwitterThread(
    timeline.title,
    timeline.description || undefined,
    events,
    timelineUrl,
    timelineImageUrl
  );

  const threadText = formatTweetsAsThreadString(tweets);

  const handleCopy = async () => {
    try {
      await copyThreadToClipboard(tweets);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Twitter thread copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleConnectTwitter = () => {
    window.location.href = "/api/twitter/oauth";
  };

  const handlePostThread = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post on Twitter",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Twitter not connected",
        description: "Please connect your Twitter account first",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch("/api/twitter/post-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineId,
          timelineTitle: timeline.title,
          timelineDescription: timeline.description,
          timelineUrl,
          timelineImageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post thread");
      }

      const data = await response.json();
      toast({
        title: "Success!",
        description: "Twitter thread posted successfully",
      });
    } catch (error: any) {
      console.error("Error posting thread:", error);
      toast({
        title: "Failed to post",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/timeline/${timelineId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Timeline
          </Button>
          <h1 className="text-3xl font-display font-bold mb-2">Share on Twitter</h1>
          <p className="text-muted-foreground">
            Create and share your timeline as a Twitter thread
          </p>
        </div>

        <div className="space-y-6">
          {/* Twitter Tweet Template Preview */}
          {timelineImageUrl && (
            <Card className="p-6">
              <Label className="text-base mb-4 block">Share Timeline on X/Twitter</Label>
              <TimelineTweetTemplate
                title={timeline.title}
                description={timeline.description || `Explore this timeline: ${timeline.title}`}
                imageUrl={timelineImageUrl}
                timelineUrl={timelineUrl}
              />
            </Card>
          )}

          {/* Twitter Thread Preview */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Twitter Thread Preview</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Thread
                      </>
                    )}
                  </Button>
                  {isSignedIn && (
                    <Button
                      onClick={handlePostThread}
                      disabled={isPosting || !isConnected || isChecking}
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Twitter className="mr-2 h-4 w-4" />
                          Post Thread
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {isSignedIn && (
                <div className="text-sm text-muted-foreground">
                  {isChecking ? (
                    "Checking Twitter connection..."
                  ) : isConnected ? (
                    "✓ Connected - Ready to post"
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>⚠️ Not connected</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleConnectTwitter}
                        className="h-auto p-0 text-sm"
                      >
                        Connect Twitter
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Textarea
                value={threadText}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

