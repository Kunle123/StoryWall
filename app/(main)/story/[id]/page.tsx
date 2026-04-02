"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown, X, Heart, Layers } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchEventById, fetchEventsByTimelineId, fetchCommentsByTimelineId, fetchEventLikeStatus, likeEvent, unlikeEvent, fetchTimelineById, fetchFollowStatus, followUser, unfollowUser } from "@/lib/api/client";
import { formatEventDate, formatNumberedEvent } from "@/lib/utils/dateFormat";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useLayoutEffect } from "react";
import {
  tryConsumeAnonymousTimelineView,
  clearAnonymousBrowseHistory,
} from "@/lib/utils/anonymousBrowseLimit";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { ViralFooter } from "@/components/sharing/ViralFooter";
import { ImageWithWatermark } from "@/components/timeline/ImageWithWatermark";
import { cn } from "@/lib/utils";

function StoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTimeline = searchParams.get("from") === "timeline";
  const storyTimelineQuery = fromTimeline ? "?from=timeline" : "";
  const { isSignedIn, isLoaded } = useUser();
  const [storyBrowseOk, setStoryBrowseOk] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [liking, setLiking] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [timelineCreator, setTimelineCreator] = useState<{ id?: string; name: string; username?: string; avatar?: string; bio?: string } | null>(null);
  const [timelineIsPublic, setTimelineIsPublic] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  /** Mobile: compact summary first; tap to expand full story with animation */
  const [detailExpanded, setDetailExpanded] = useState(false);
  const { toast } = useToast();
  
  const minSwipeDistance = 50;

  useLayoutEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    clearAnonymousBrowseHistory();
    setStoryBrowseOk(true);
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || isSignedIn || !event?.timeline_id) return;
    const { allowed } = tryConsumeAnonymousTimelineView(event.timeline_id);
    if (!allowed) {
      const next =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/story/${params.id}`;
      router.replace(`/sign-in?redirect=${encodeURIComponent(next)}`);
      return;
    }
    setStoryBrowseOk(true);
  }, [isLoaded, isSignedIn, event?.timeline_id, router, params.id]);
  
  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setTimelineTitle(null);
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
              setTimelineTitle(
                typeof timeline.title === "string" && timeline.title.trim()
                  ? timeline.title.trim()
                  : null
              );
              // Check if timeline is public for footer display
              setTimelineIsPublic(timeline.is_public !== false);
              // Extract creator info from timeline
              // API returns timeline.creator (not timeline.user)
              const creator = timeline.creator;
              const creatorName = creator?.username || creator?.email?.split('@')[0] || "Timeline Creator";
              const creatorUsername = creator?.username ? `@${creator.username}` : creator?.email?.split('@')[0] ? `@${creator.email.split('@')[0]}` : "@historian";
              const creatorAvatar = creator?.avatar_url;
              const creatorId = creator?.id;
              const creatorBio = creator?.bio;
              setTimelineCreator({
                id: creatorId,
                name: creatorName,
                username: creatorUsername,
                avatar: creatorAvatar,
                bio: creatorBio
              });
              
              // Fetch follow status if user is signed in and creator ID is available
              if (isSignedIn && creatorId) {
                const followStatusResult = await fetchFollowStatus(creatorId);
                if (followStatusResult.data) {
                  setIsFollowing(followStatusResult.data.following);
                }
              }
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
      router.push(`/story/${allEvents[currentIndex + 1].id}${storyTimelineQuery}`);
    }
    if (isRightSwipe && hasPrev) {
      router.push(`/story/${allEvents[currentIndex - 1].id}${storyTimelineQuery}`);
    }
  };
  
  const goToNext = () => {
    if (hasNext) {
      setSlideDirection('left');
      setTimeout(
        () => router.push(`/story/${allEvents[currentIndex + 1].id}${storyTimelineQuery}`),
        50
      );
    }
  };
  
  const goToPrev = () => {
    if (hasPrev) {
      setSlideDirection('right');
      setTimeout(
        () => router.push(`/story/${allEvents[currentIndex - 1].id}${storyTimelineQuery}`),
        50
      );
    }
  };

  useEffect(() => {
    setSlideDirection(null);
    setDetailExpanded(false);
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

  // Short or empty body: no need for summary mode on mobile
  useEffect(() => {
    if (!event?.description?.trim()) {
      setDetailExpanded(true);
    }
  }, [event?.description, event?.id]);

  const expandStoryDetail = () => {
    setDetailExpanded(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const collapseStoryDetail = () => {
    setDetailExpanded(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

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

  if (!isLoaded || loading) {
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

  if (!storyBrowseOk) {
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

  const formatDate = (event: TimelineEvent) => {
    // For numbered events, use formatNumberedEvent
    if (event.number !== undefined) {
      return formatNumberedEvent(event.number, event.numberLabel || "Event");
    }
    // For dated events, use formatEventDate
    return formatEventDate(event.year || 0, event.month, event.day);
  };

  // Format date for dial (number only for numbered events, no label)
  const formatDateForDial = (event: TimelineEvent, startDate?: Date, endDate?: Date): { type: 'numbered'; value: string } | { type: 'dated'; day: string | null; month: string | null; year: string; duration: string | null } | undefined => {
    // For numbered events, show only the number (no label)
    if (event.number !== undefined) {
      return { type: 'numbered', value: event.number.toString() };
    }
    // For dated events, return structured format for 3-line display
    if (event.year) {
      const day = event.day || null;
      const month = event.month ? new Date(event.year, event.month - 1).toLocaleDateString('en-US', { month: 'short' }) : null;
      const year = event.year.toString();
      
      // Calculate duration (total span from start to end)
      let duration: string | null = null;
      if (startDate && endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffYears = Math.floor(diffDays / 365);
        if (diffYears > 0) {
          duration = `${diffYears}y`;
        } else if (diffDays > 0) {
          duration = `${diffDays}d`;
        }
      }
      
      return { 
        type: 'dated', 
        day: day ? day.toString() : null,
        month: month,
        year,
        duration
      };
    }
    return undefined;
  };

  // Widget data - calculate dates for ExperimentalBottomMenuBar
  const startDate = allEvents.length > 0 ? new Date(Math.min(...allEvents.map(e => {
    // For start date, use Jan 1 if month/day missing
    return new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime();
  }))) : undefined;
  const endDate = allEvents.length > 0 ? new Date(Math.max(...allEvents.map(e => {
    // For end date, use actual date if available
    if (e.month && e.day) {
      return new Date(e.year, e.month - 1, e.day).getTime();
    } else if (e.month) {
      // If only month is available, use the last day of that month
      return new Date(e.year, e.month, 0).getTime(); // Day 0 = last day of previous month
    } else {
      // If only year is available, use Dec 31 of that year to ensure it's the latest
      return new Date(e.year, 11, 31).getTime();
    }
  }))) : undefined;
  const selectedDate = event ? formatDateForDial(event, startDate, endDate) : undefined;
  const timelinePosition = allEvents.length > 1 && currentIndex >= 0 ? currentIndex / (allEvents.length - 1) : 0.5;

  return (
    <div
      className={cn(
        "min-h-screen",
        fromTimeline ? "bg-muted/35 dark:bg-muted/20" : "bg-background"
      )}
    >
      {fromTimeline && (
        <header
          className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm"
          role="banner"
        >
          <div className="flex items-stretch gap-3 px-3 py-2.5 max-w-4xl mx-auto">
            <div
              className="w-1 self-stretch min-h-[3rem] rounded-full bg-primary shrink-0 shadow-[0_0_14px_-3px_hsl(var(--primary)/0.55)]"
              aria-hidden
            />
            <div className="flex gap-2.5 min-w-0 flex-1 items-start">
              <Layers className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Inside timeline
                </p>
                <p className="font-display text-sm font-semibold leading-snug text-foreground truncate">
                  {timelineTitle ?? "Story"}
                </p>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5 pr-2">
                  Event detail — scroll is scoped below this story
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          "container mx-auto pb-32 md:pb-40 max-w-4xl",
          fromTimeline ? "px-3 sm:px-4 pt-3" : "px-0 md:px-4 pt-4"
        )}
      >
        <div
          className={cn(
            fromTimeline &&
              "rounded-2xl border border-primary/25 bg-gradient-to-b from-muted/50 to-background p-2 sm:p-3 shadow-inner ring-1 ring-border/60 animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none"
          )}
        >
          <div
            className={cn(
              "relative",
              fromTimeline &&
                "rounded-xl border-l-[5px] border-primary bg-card shadow-md ring-1 ring-border/50 overflow-hidden"
            )}
          >
        <Card 
          key={String(Array.isArray(params.id) ? params.id[0] : params.id)}
          className={`relative p-6 md:p-8 rounded-none transition-all duration-300 motion-reduce:transition-none ${
            fromTimeline ? "md:rounded-lg border-0 shadow-none" : "md:rounded-lg"
          } ${
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
                  {timelineCreator?.name && timelineCreator.name.length > 0 ? timelineCreator.name[0].toUpperCase() : 'TC'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold leading-tight">{timelineCreator?.name || "Timeline Creator"}</p>
                <p className="text-sm text-muted-foreground">{timelineCreator?.username || "@historian"}</p>
                {timelineCreator?.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{timelineCreator.bio}</p>
                )}
              </div>
            </div>
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant={isFollowing ? "outline" : "default"}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="rounded-full h-8 px-4 text-sm font-bold"
              onClick={async () => {
                if (!timelineCreator?.id || !isSignedIn) {
                  toast({
                    title: "Error",
                    description: "Unable to follow user",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  if (isFollowing) {
                    const result = await unfollowUser(timelineCreator.id);
                    if (result.data) {
                      setIsFollowing(false);
                      toast({
                        title: "Unfollowed",
                        description: `You unfollowed ${timelineCreator.name}`,
                      });
                    } else {
                      toast({
                        title: "Error",
                        description: result.error || "Failed to unfollow user",
                        variant: "destructive",
                      });
                    }
                  } else {
                    const result = await followUser(timelineCreator.id);
                    if (result.data) {
                      setIsFollowing(true);
                      toast({
                        title: "Following",
                        description: `You are now following ${timelineCreator.name}`,
                      });
                    } else {
                      toast({
                        title: "Error",
                        description: result.error || "Failed to follow user",
                        variant: "destructive",
                      });
                    }
                  }
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to update follow status",
                    variant: "destructive",
                  });
                }
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* Multimedia Content — mobile: animates from summary height to full */}
          {(event.image || event.video) && (
            <div
              className={cn(
                "mb-3 rounded-lg overflow-hidden border border-border max-md:origin-top motion-reduce:transition-none",
                "max-md:transition-[max-height] max-md:duration-500 max-md:ease-out",
                detailExpanded
                  ? "max-md:max-h-[min(88vh,560px)]"
                  : "max-md:max-h-[min(42vh,280px)]"
              )}
            >
              {event.image && (
                <ImageWithWatermark
                  src={event.image}
                  alt={event.title}
                  isFirstOrLast={currentIndex === 0 || currentIndex === allEvents.length - 1}
                  timelineIsPublic={timelineIsPublic}
                  className="w-full h-auto max-h-[500px] object-cover md:max-h-[500px]"
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
            <div className="relative mb-3">
              <p
                className={cn(
                  "text-base whitespace-pre-wrap transition-opacity duration-300 motion-reduce:transition-none",
                  !detailExpanded && "max-md:line-clamp-4"
                )}
              >
                {event.description}
              </p>
              {!detailExpanded && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent md:hidden"
                  aria-hidden
                />
              )}
            </div>
          )}

          {/* Mobile: expand into full story */}
          {event.description?.trim() && (
            <div className="mb-4 md:hidden">
              {!detailExpanded ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2 rounded-xl py-6 text-base font-semibold shadow-sm touch-manipulation animate-in fade-in duration-300"
                  onClick={expandStoryDetail}
                >
                  Read full story
                  <ChevronDown className="w-5 h-5 shrink-0" />
                </Button>
              ) : null}
            </div>
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

          {/* Comments + footer — full view on mobile only after expand */}
          <div
            className={cn(
              !detailExpanded && "max-md:hidden",
              detailExpanded && "max-md:animate-in max-md:fade-in max-md:duration-300"
            )}
          >
            {/* Comments Section */}
            <div id="comments" className="mt-6 pt-6 pb-32 md:pb-40 border-t border-border scroll-mt-24 max-md:mt-0 max-md:pt-4">
              <CommentsSection eventId={event.id} />
            </div>

            {/* Viral Footer - Only show on public timelines */}
            {timelineIsPublic && (
              <ViralFooter timelineTitle={event.title} />
            )}
          </div>
        </Card>
          </div>
        </div>
      </main>

      {/* Mobile: collapse full view back to summary */}
      {detailExpanded && event.description?.trim() && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="fixed bottom-28 right-4 z-[100] h-14 w-14 rounded-full shadow-xl border border-border bg-background/95 backdrop-blur-md md:hidden touch-manipulation animate-in zoom-in-95 fade-in duration-200"
          onClick={collapseStoryDetail}
          aria-label="Collapse to summary"
        >
          <X className="w-6 h-6" />
        </Button>
      )}
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
}

function StorySuspenseFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function StoryPage() {
  return (
    <Suspense fallback={<StorySuspenseFallback />}>
      <StoryPageContent />
    </Suspense>
  );
}
