"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle header hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
  }, [timelineId]);

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
        />
        <div id="comments" className="mt-12 pb-32 md:pb-40 scroll-mt-24 relative z-10">
          <CommentsSection timelineId={timeline.id || timelineId} />
        </div>
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
        const startDate = hasAny ? new Date(Math.min(
          ...datedEvents.map((e: { year: number; month?: number; day?: number }) => new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime())
        )) : undefined;
        const endDate = hasAny ? new Date(Math.max(
          ...datedEvents.map((e: { year: number; month?: number; day?: number }) => new Date(e.year, (e.month || 12) - 1, e.day || 31).getTime())
        )) : undefined;
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
          // For dated events, calculate position based on date
          if (!centeredEvent || datedEvents.length < 2 || centeredEvent.year === undefined) return 0.5;
          const sortedEvts = [...datedEvents].sort((a, b) => {
            const dateA = new Date(a.year, (a.month || 1) - 1, a.day || 1).getTime();
            const dateB = new Date(b.year, (b.month || 1) - 1, b.day || 1).getTime();
            return dateA - dateB;
          });
          const eventDate = new Date(centeredEvent.year, (centeredEvent.month || 1) - 1, centeredEvent.day || 1).getTime();
          const idx = sortedEvts.findIndex((e: { year: number; month?: number; day?: number }) => {
            const eDate = new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime();
            return eDate === eventDate;
          });
          if (idx >= 0 && sortedEvts.length > 1) {
            return idx / (sortedEvts.length - 1);
          }
          if (startDate && endDate && eventDate) {
            const totalSpan = endDate.getTime() - startDate.getTime();
            const position = (eventDate - startDate.getTime()) / totalSpan;
            return Math.min(Math.max(position, 0), 1);
          }
          return 0.5;
        })();
        const formattedDate = formatSelectedDate(centeredEvent, startDate, endDate);
        return (
          <ExperimentalBottomMenuBar
            selectedDate={formattedDate}
            timelinePosition={timelinePosition}
            startDate={startDate}
            endDate={endDate}
            isNumbered={timeline?.is_numbered || false}
            totalEvents={allEvents.length}
          />
        );
      })()}
    </div>
  );
};

export default TimelinePage;

