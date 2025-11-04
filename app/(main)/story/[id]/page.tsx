"use client";

import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Tag, ArrowLeft, Heart, Share2, UserPlus, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchEventById, fetchEventsByTimelineId } from "@/lib/api/client";
import { formatEventDate } from "@/lib/utils/dateFormat";
import { useState, useEffect } from "react";

const Story = () => {
  const params = useParams();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(248);
  const [shares, setShares] = useState(64);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        // Try API first
        const result = await fetchEventById(params.id as string);
        
        if (result.data) {
          // Transform API event to display format
          const date = new Date(result.data.date);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          
          // Check if date is Jan 1 - likely a placeholder for year-only dates
          const isPlaceholderDate = month === 1 && day === 1;
          
          const transformedEvent = {
            id: result.data.id,
            title: result.data.title,
            description: result.data.description,
            year: year,
            month: isPlaceholderDate ? undefined : month,
            day: isPlaceholderDate ? undefined : day,
            category: result.data.category,
            image: result.data.image_url,
            video: undefined,
            timeline_id: result.data.timeline_id,
          };
          setEvent(transformedEvent);
          
          // Load all events from the same timeline for navigation
          if (result.data.timeline_id) {
            const eventsResult = await fetchEventsByTimelineId(result.data.timeline_id);
            if (eventsResult.data) {
              const transformed = eventsResult.data.map((e: any) => {
                const d = new Date(e.date);
                return {
                  id: e.id,
                  year: d.getFullYear(),
                  month: d.getMonth() + 1,
                  day: d.getDate(),
                };
              });
              setAllEvents(transformed);
            }
          }
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error('Failed to load event from API:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      loadEvent();
    }
  }, [params.id]);
  
  const currentIndex = allEvents.findIndex(e => e.id === event?.id);
  const hasNext = currentIndex >= 0 && currentIndex < allEvents.length - 1;
  const hasPrev = currentIndex > 0;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && hasNext) {
      router.push(`/story/${allEvents[currentIndex + 1].id}`);
    }
    if (isRightSwipe && hasPrev) {
      router.push(`/story/${allEvents[currentIndex - 1].id}`);
    }
  };
  
  const goToNext = () => {
    if (hasNext) router.push(`/story/${allEvents[currentIndex + 1].id}`);
  };
  
  const goToPrev = () => {
    if (hasPrev) router.push(`/story/${allEvents[currentIndex - 1].id}`);
  };

  // Comments are now stored at the timeline level, not individual events
  // Individual event pages don't have their own comments
  const comments: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Timeline
          </Button>
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold font-display mb-2">Event Not Found</h2>
            <p className="text-sm text-muted-foreground">This timeline event does not exist.</p>
          </Card>
        </main>
      </div>
    );
  }

  const formatDate = (year: number, month?: number, day?: number) => {
    return formatEventDate(year, month, day);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Timeline
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              disabled={!hasPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={!hasNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Single Unified Card */}
        <Card 
          className="p-6"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* User Profile and Follow Button at Top */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">TC</span>
              </div>
              <div>
                <p className="text-base font-bold leading-tight">Timeline Creator</p>
                <p className="text-sm text-muted-foreground">@historian</p>
              </div>
            </div>
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant={isFollowing ? "outline" : "default"}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="rounded-full h-8 px-4 text-sm font-bold"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* Multimedia Content */}
          {(event.image || event.video) && (
            <div className="mb-3 rounded-lg overflow-hidden border border-border">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              )}
              {event.video && (
                <video 
                  src={event.video}
                  controls
                  className="w-full h-auto max-h-[500px]"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-3">{event.title}</h1>

          {event.description && (
            <p className="text-base mb-3">
              {event.description}
            </p>
          )}

          {/* Date and Category */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <span className="text-sm text-muted-foreground">
              {formatDate(event.year, event.month, event.day)}
            </span>
            {event.category && (
              <>
                <span className="text-muted-foreground">·</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    event.category === "vehicle"
                      ? "bg-primary/10 text-primary"
                      : event.category === "crisis"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {event.category}
                </span>
              </>
            )}
          </div>

          {/* Social Actions */}
          <div className="flex items-center gap-12 py-3 border-b border-border">
            <Button
              variant="ghost"
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className={`gap-2 h-auto p-0 hover:text-pink-600 transition-colors ${isLiked ? "text-pink-600" : "text-muted-foreground"}`}
              onClick={() => {
                setIsLiked(!isLiked);
                setLikes(isLiked ? likes - 1 : likes + 1);
              }}
            >
              <Heart className={`w-[18px] h-[18px] ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{likes}</span>
            </Button>
            <Button 
              variant="ghost" 
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm" 
              className="gap-2 h-auto p-0 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm">0</span>
            </Button>
            <Button 
              variant="ghost" 
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm" 
              className="gap-2 h-auto p-0 text-muted-foreground hover:text-green-600 transition-colors"
            >
              <Share2 className="w-[18px] h-[18px]" />
              <span className="text-sm">{shares}</span>
            </Button>
          </div>

          {/* Comments are at timeline level, not event level */}
          {/* Comments section removed - users should comment on the timeline, not individual events */}
        </Card>
      </main>
    </div>
  );
};

export default Story;
