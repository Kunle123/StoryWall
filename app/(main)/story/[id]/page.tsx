"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Tag, ChevronLeft, ChevronRight, X, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchEventById, fetchEventsByTimelineId, fetchCommentsByTimelineId, fetchEventLikeStatus, likeEvent, unlikeEvent, fetchTimelineById } from "@/lib/api/client";
import { formatEventDate, formatNumberedEvent } from "@/lib/utils/dateFormat";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { TimelineEvent } from "@/components/timeline/Timeline";

const Story = () => {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [liking, setLiking] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [timelineCreator, setTimelineCreator] = useState<{ name: string; username?: string; avatar?: string } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const { toast } = useToast();
  
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
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const day = d.getDate();
                
                // Check if date is Jan 1 - likely a placeholder for year-only dates
                const isPlaceholderDate = month === 1 && day === 1;
                
                return {
                  id: e.id,
                  year: year,
                  month: isPlaceholderDate ? undefined : month,
                  day: isPlaceholderDate ? undefined : day,
                };
              });
              setAllEvents(transformed);
            }
            
            // Load comment count for the timeline
            const commentsResult = await fetchCommentsByTimelineId(result.data.timeline_id);
            if (commentsResult.data) {
              setCommentCount(commentsResult.data.length);
            }
            
            // Fetch timeline to get creator information
            const timelineResult = await fetchTimelineById(result.data.timeline_id);
            if (timelineResult.data) {
              const timeline = timelineResult.data;
              // Extract creator info from timeline
              const creatorName = timeline.user?.username || timeline.user?.name || timeline.creator || "Timeline Creator";
              const creatorUsername = timeline.user?.username ? `@${timeline.user.username}` : timeline.user?.email?.split('@')[0] || "@historian";
              const creatorAvatar = timeline.user?.avatar_url || timeline.avatar;
              setTimelineCreator({
                name: creatorName,
                username: creatorUsername,
                avatar: creatorAvatar
              });
            }
          }
          
          // Fetch like status and stats
          if (isSignedIn) {
            const likeStatus = await fetchEventLikeStatus(transformedEvent.id);
            if (likeStatus.data) {
              setIsLiked(likeStatus.data.user_liked);
              setLikes(likeStatus.data.likes_count);
            }
          } else {
            // Fetch stats without like status
            const statsResponse = await fetch(`/api/events/${transformedEvent.id}/stats`);
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              setLikes(stats.likes || 0);
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
  }, [params.id, isSignedIn]);

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
    if (hasNext) {
      setSlideDirection('left');
      setTimeout(() => router.push(`/story/${allEvents[currentIndex + 1].id}`), 50);
    }
  };
  
  const goToPrev = () => {
    if (hasPrev) {
      setSlideDirection('right');
      setTimeout(() => router.push(`/story/${allEvents[currentIndex - 1].id}`), 50);
    }
  };

  useEffect(() => {
    setSlideDirection(null);
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to comments section if hash is present
  useEffect(() => {
    if (event && window.location.hash === '#comments') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const commentsElement = document.getElementById('comments');
        if (commentsElement) {
          commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [event]);

  const handleLike = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like events",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }
    
    if (!event) return;
    
    try {
      setLiking(true);
      const result = isLiked 
        ? await unlikeEvent(event.id)
        : await likeEvent(event.id);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setIsLiked(result.data.liked);
        setLikes(result.data.likes_count);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle like",
        variant: "destructive",
      });
    } finally {
      setLiking(false);
    }
  };

  const handleCommentClick = () => {
    // Navigate to timeline page with comments section
    if (event?.timeline_id) {
      router.push(`/timeline/${event.timeline_id}#comments`);
    } else {
      toast({
        title: "Unable to navigate",
        description: "Timeline information not available",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/story/${params.id}`;
    const title = event?.title || "StoryWall Event";
    const text = event?.description ? `${event.title}: ${event.description}` : event?.title || "Check out this timeline event on StoryWall";
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        setShares(shares + 1);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Event link copied to clipboard",
        });
        setShares(shares + 1);
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Event link copied to clipboard",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
        <main className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => router.push("/")}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold font-display mb-2">Event Not Found</h2>
            <p className="text-sm text-muted-foreground">This timeline event does not exist.</p>
          </Card>
        </main>
      </div>
    );
  }

  const formatDate = (event: TimelineEvent) => {
    // For numbered events, use formatNumberedEvent
    if (event.number !== undefined) {
      return formatNumberedEvent(event.number, event.numberLabel || "Event");
    }
    // For dated events, use formatEventDate
    return formatEventDate(event.year || 0, event.month, event.day);
  };

  // Format date for dial (number only for numbered events, no label)
  const formatDateForDial = (event: TimelineEvent) => {
    // For numbered events, show only the number (no label)
    if (event.number !== undefined) {
      return event.number.toString();
    }
    // For dated events, use formatEventDate
    return formatEventDate(event.year || 0, event.month, event.day);
  };

  // Widget data - calculate dates for ExperimentalBottomMenuBar
  const selectedDate = event ? formatDateForDial(event) : undefined;
  const timelinePosition = allEvents.length > 1 && currentIndex >= 0 ? currentIndex / (allEvents.length - 1) : 0.5;

  const startDate = allEvents.length > 0 ? new Date(Math.min(...allEvents.map(e => new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime()))) : undefined;
  const endDate = allEvents.length > 0 ? new Date(Math.max(...allEvents.map(e => new Date(e.year, (e.month || 12) - 1, e.day || 31).getTime()))) : undefined;

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-0 md:px-4 pt-4 pb-32 md:pb-40 max-w-4xl">
        {/* Single Unified Card */}
        <Card 
          key={String(Array.isArray(params.id) ? params.id[0] : params.id)}
          className={`relative p-6 md:p-8 rounded-none md:rounded-lg transition-all duration-300 ${
            slideDirection === 'left' ? 'animate-slide-out-left' : 
            slideDirection === 'right' ? 'animate-slide-out-right' : 
            'animate-slide-in'
          }`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Navigation buttons for tablet and desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background disabled:opacity-30"
            onClick={goToPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background disabled:opacity-30"
            onClick={goToNext}
            disabled={!hasNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          {/* Close Button */}
        <Button
          variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full hover:bg-muted"
          onClick={() => {
            if (event?.timeline_id) {
              router.push(`/timeline/${event.timeline_id}`);
            } else {
              router.push("/");
            }
          }}
        >
            <X className="w-5 h-5" />
        </Button>

          {/* User Profile and Follow Button */}
          <div className="flex items-center justify-between mb-4 pr-16">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={timelineCreator?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {timelineCreator?.name ? timelineCreator.name[0].toUpperCase() : 'TC'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold leading-tight">{timelineCreator?.name || "Timeline Creator"}</p>
                <p className="text-sm text-muted-foreground">{timelineCreator?.username || "@historian"}</p>
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
              {formatDate(event)}
            </span>
            {event.category && (
              <>
                <span className="text-muted-foreground">·</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    event.category === "vehicle"
                      ? "bg-primary/10 text-primary"
                      : event.category === "crisis"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {event.category}
                </span>
              </>
            )}
          </div>

          {/* Like Button */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 h-auto p-0 hover:text-pink-600 transition-colors ${isLiked ? "text-pink-600" : "text-muted-foreground"}`}
              onClick={handleLike}
              disabled={liking}
            >
              <Heart className={`w-[18px] h-[18px] ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{likes}</span>
            </Button>
          </div>

          {/* Comments Section */}
          <div id="comments" className="mt-6 pt-6 pb-32 md:pb-40 border-t border-border scroll-mt-24">
            <CommentsSection eventId={event.id} />
          </div>
        </Card>
      </main>
      {event && allEvents.length > 0 && (
        <ExperimentalBottomMenuBar
          selectedDate={selectedDate}
          timelinePosition={timelinePosition}
          startDate={startDate}
          endDate={endDate}
          isNumbered={event.number !== undefined}
          totalEvents={allEvents.length}
        />
      )}
    </div>
  );
};

export default Story;
