"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelineById, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { Toaster } from "@/components/ui/toaster";
import { formatEventDate, formatEventDateShort, formatNumberedEvent } from "@/lib/utils/dateFormat";
import { CommentsSection } from "@/components/timeline/CommentsSection";

const TimelinePage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const timelineId = params.id as string;
  const isEditMode = searchParams?.get('edit') === 'true';

  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentsRequested, setCommentsRequested] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  
  // Reset commentsRequested flag after scroll animation completes
  useEffect(() => {
    if (!commentsRequested) return;
    
    const resetTimeout = setTimeout(() => {
      setCommentsRequested(false);
    }, 1500); // Allow time for smooth scroll animation to complete
    
    return () => clearTimeout(resetTimeout);
  }, [commentsRequested]);
  
  // Handle header hide/show on scroll and comments visibility
  useEffect(() => {
    let hideCommentsTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear any pending hide timeout
      clearTimeout(hideCommentsTimeout);
      
      // Hide comments when scrolling (unless they were just requested via button click)
      // Only hide if comments are currently shown and user is scrolling away
      if (showComments && !commentsRequested) {
        // Small delay to avoid flickering during smooth scroll
        hideCommentsTimeout = setTimeout(() => {
          setShowComments(false);
        }, 200);
      }
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(hideCommentsTimeout);
    };
  }, [lastScrollY, commentsRequested, showComments]);
  
  // Handle comments button click from event cards
  useEffect(() => {
    const handleCommentsClick = () => {
      // Only show comments when explicitly requested via button click
      setCommentsRequested(true);
      setShowComments(true);
      // Scroll to comments section
      setTimeout(() => {
        const commentsElement = document.getElementById('comments');
        if (commentsElement) {
          commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };
    
    window.addEventListener('show-comments', handleCommentsClick);
    return () => window.removeEventListener('show-comments', handleCommentsClick);
  }, []);

  // Format the centered event date for dial (3-line format: day, month, year)
  const formatSelectedDate = (event: TimelineEvent | null, startDate?: Date, endDate?: Date) => {
    if (!event) return undefined;
    // For numbered events, show only the number (no label)
    if (event.number !== undefined) {
      return { type: 'numbered' as const, value: event.number.toString() };
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
        type: 'dated' as const, 
        day: day ? day.toString() : null,
        month: month,
        year,
        duration
      };
    }
    return undefined;
  };


  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        setError(null);
        
        // Try API first - fetchTimelineById handles both UUID and slug
        const timelineResult = await fetchTimelineById(timelineId);
        
        if (timelineResult.data) {
          setTimeline(timelineResult.data);
          
          // Check if user can edit (owner or admin)
          if (isEditMode && isSignedIn && user) {
            const timelineCreatorId = timelineResult.data.creator?.id || timelineResult.data.creator_id;
            const userEmail = user.primaryEmailAddress?.emailAddress;
            
            // Get user's database ID from Clerk ID
            try {
              const userResponse = await fetch('/api/user/profile');
              if (userResponse.ok) {
                const userData = await userResponse.json();
                const userDbId = userData.id;
                const isOwner = timelineCreatorId && userDbId === timelineCreatorId;
                const isAdmin = userEmail === 'kunle2000@gmail.com'; // Admin email check
                setCanEdit(isOwner || isAdmin);
                
                if (!isOwner && !isAdmin) {
                  setError('You do not have permission to edit this timeline');
                }
              } else {
                setCanEdit(false);
                setError('Failed to verify user permissions');
              }
            } catch (err) {
              console.error('Error checking user permissions:', err);
              setCanEdit(false);
              setError('Failed to verify user permissions');
            }
          }
          
          // Use the timeline ID (not the slug) for fetching events
          const eventsTimelineId = timelineResult.data.id || timelineId;
          const eventsResult = await fetchEventsByTimelineId(eventsTimelineId);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
          } else {
            setEvents([]);
          }
        } else {
          setError('Timeline not found');
        }
      } catch (err) {
        console.error('Failed to load timeline:', err);
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    }
    
    if (timelineId) {
      loadTimeline();
    }
  }, [timelineId, isEditMode, isSignedIn, user]);

  // Scroll to comments section if hash is present
  useEffect(() => {
    if (!loading && window.location.hash === '#comments') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const commentsElement = document.getElementById('comments');
        if (commentsElement) {
          commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={showHeader} />
        <main className="container mx-auto px-3 pt-16 pb-32 max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading timeline...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={showHeader} />
        <main className="container mx-auto px-3 pt-16 pb-32 max-w-6xl">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Timeline Not Found</h2>
            <p className="text-muted-foreground">{error || "This timeline does not exist."}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={showHeader} />
      <SubMenuBar 
        title={timeline.title} 
        selectedDate={centeredEvent ? (centeredEvent.number !== undefined 
          ? centeredEvent.number.toString() 
          : formatEventDateShort(centeredEvent.year || 0, centeredEvent.month, centeredEvent.day)) : undefined}
        headerVisible={showHeader}
      />
      <Toaster />
      <main className={`container mx-auto px-3 pb-32 md:pb-40 max-w-6xl transition-all duration-300 ${
        showHeader ? 'pt-[96px]' : 'pt-[44px]'
      }`}>
        <Timeline 
          events={events.length > 0 ? events : timeline.events || []} 
          pixelsPerYear={30} 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCenteredEventChange={setCenteredEvent}
          isEditable={isEditMode && canEdit}
          timelineId={timeline.id}
          timeline={timeline}
          onEventUpdate={(updatedEvent) => {
            // Update the event in the local state
            setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          }}
        />
        {showComments && (
          <div id="comments" className="mt-12 pb-32 md:pb-40 scroll-mt-24 relative z-10">
            <CommentsSection timelineId={timeline.id || timelineId} />
          </div>
        )}
      </main>
      {(() => {
        // Filter to only dated events (numbered events don't have years)
        const allEvents = events.length > 0 ? events : (timeline.events || []);
        const datedEvents = allEvents.filter((e: any) => e.year !== undefined).map((e: any) => ({
          year: e.year,
          month: e.month,
          day: e.day,
        }));
        const hasAny = datedEvents.length > 0;
        
        // Check if any events have BC dates (negative years)
        const hasBCDates = datedEvents.some((e: { year: number }) => e.year < 0);
        
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        
        if (hasAny) {
          if (hasBCDates) {
            // For BC dates, calculate using years directly
            const years = datedEvents.map((e: { year: number }) => e.year);
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            
            // Create Date objects using year 0 as reference, then adjust
            const referenceYear = 0;
            startDate = new Date(referenceYear, 0, 1);
            endDate = new Date(referenceYear, 11, 31);
            startDate.setFullYear(startDate.getFullYear() + minYear);
            endDate.setFullYear(endDate.getFullYear() + maxYear);
          } else {
            // All AD dates: use Date objects normally
            startDate = new Date(Math.min(
              ...datedEvents.map((e: { year: number; month?: number; day?: number }) => {
                // For start date, use Jan 1 if month/day missing
                return new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime();
              })
            ));
            endDate = new Date(Math.max(
              ...datedEvents.map((e: { year: number; month?: number; day?: number }) => {
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
              })
            ));
          }
        }
        const timelinePosition = (() => {
          // For numbered events, calculate position based on number
          if (centeredEvent?.number !== undefined) {
            const numberedEvents = allEvents.filter((e: any) => e.number !== undefined).sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
            const idx = numberedEvents.findIndex((e: any) => e.id === centeredEvent.id);
            if (idx >= 0 && numberedEvents.length > 1) {
              return idx / (numberedEvents.length - 1);
            }
            return 0.5;
          }
          // For dated events, calculate position based on actual date, not event index
          if (!centeredEvent || centeredEvent.year === undefined || !startDate || !endDate) return 0.5;
          
          // Handle BC dates: use year-based calculation for negative years
          if (centeredEvent.year < 0) {
            // BC date: calculate position using years directly
            const allEvents = events.length > 0 ? events : (timeline.events || []);
            const datedEvents = allEvents.filter((e: any) => e.year !== undefined);
            if (datedEvents.length === 0) return 0.5;
            
            const years = datedEvents.map((e: any) => e.year).filter((y: any) => y !== undefined);
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const yearRange = maxYear - minYear;
            if (yearRange === 0) return 0.5;
            
            const yearPosition = (centeredEvent.year - minYear) / yearRange;
            return Math.min(Math.max(yearPosition, 0), 1);
          } else {
            // AD date: use Date objects
            const eventDate = new Date(
              centeredEvent.year, 
              (centeredEvent.month || 1) - 1, 
              centeredEvent.day || 1
            ).getTime();
            
            // Calculate position based on date span, not event count
            const totalSpan = endDate.getTime() - startDate.getTime();
            if (totalSpan <= 0) return 0.5;
            
            const position = (eventDate - startDate.getTime()) / totalSpan;
            return Math.min(Math.max(position, 0), 1);
          }
        })();
        const formattedDate = formatSelectedDate(centeredEvent, startDate, endDate);
        
        // Get timeline URL - use slug if available, otherwise use ID
        const timelineSlug = timeline?.slug;
        const timelineUrlId = timelineSlug || timelineId;
        const currentUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/timeline/${timelineUrlId}`
          : '';
        
        // Get first event's image for Twitter share
        const firstEventImage = allEvents.length > 0 && allEvents[0]?.image 
          ? allEvents[0].image 
          : (timeline?.events?.[0]?.image_url || undefined);
        
        return (
          <ExperimentalBottomMenuBar
            selectedDate={formattedDate}
            timelinePosition={timelinePosition}
            startDate={startDate}
            endDate={endDate}
            isNumbered={timeline?.is_numbered || false}
            totalEvents={allEvents.length}
            timelineTitle={timeline?.title}
            timelineDescription={timeline?.description}
            timelineImageUrl={firstEventImage}
            timelineUrl={currentUrl}
            onShareTwitterThread={() => {
              router.push(`/timeline/${timelineId}/share/twitter`);
            }}
            onShareTikTokSlideshow={() => {
              router.push(`/timeline/${timelineId}/share/tiktok`);
            }}
          />
        );
      })()}
    </div>
  );
};

export default TimelinePage;

