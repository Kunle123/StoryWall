"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelines, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { Toaster } from "@/components/ui/toaster";
import { formatEventDate, formatEventDateShort, formatNumberedEvent } from "@/lib/utils/dateFormat";

const Index = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("Interactive Timeline");
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Format the centered event date for dial (short format for constrained space)
  const formatSelectedDate = (event: TimelineEvent | null) => {
    if (!event) return undefined;
    // For numbered events, show number with label
    if (event.number !== undefined) {
      return formatNumberedEvent(event.number, event.numberLabel || "Event");
    }
    // For dated events, use short format (11/03/22) for dial display
    return formatEventDateShort(event.year || 0, event.month, event.day);
  };

  // Get preceding and following events
  const getPrecedingEvent = () => {
    if (!centeredEvent) return null;
    const currentIndex = events.findIndex(e => e.id === centeredEvent.id);
    return currentIndex > 0 ? events[currentIndex - 1] : null;
  };

  const getFollowingEvent = () => {
    if (!centeredEvent) return null;
    const currentIndex = events.findIndex(e => e.id === centeredEvent.id);
    return currentIndex < events.length - 1 ? events[currentIndex + 1] : null;
  };

  // Calculate timeline position as percentage
  const getTimelinePosition = () => {
    if (!centeredEvent || events.length === 0) return 0.5;
    const currentIndex = events.findIndex(e => e.id === centeredEvent.id);
    return events.length > 1 ? currentIndex / (events.length - 1) : 0.5;
  };

  const handleTimelineScroll = (scrollTop: number, lastScrollTop: number) => {
    // Use requestAnimationFrame to batch state updates and prevent flickering
    requestAnimationFrame(() => {
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down - hide header
        setShowHeader(false);
      } else if (scrollTop < lastScrollTop) {
        // Scrolling up - show header
        setShowHeader(true);
      }
      // Update lastScrollY for next comparison
      setLastScrollY(scrollTop);
    });
  };

  
  useEffect(() => {
    // Try to fetch the first public timeline from API
    async function loadTimeline() {
      try {
        setLoading(true);
        const timelinesResult = await fetchTimelines({ limit: 1, is_public: true });
        
        if (timelinesResult.data && timelinesResult.data.length > 0) {
          const timeline = timelinesResult.data[0];
          setTimelineTitle(timeline.title || "Interactive Timeline");
          
          // Fetch events for this timeline
          const eventsResult = await fetchEventsByTimelineId(timeline.id);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
            setLoading(false);
            return;
          }
        }
        
        // No timeline found - show empty state
        setEvents([]);
        setTimelineTitle("Interactive Timeline");
      } catch (error) {
        console.error('Failed to load timeline from API:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadTimeline();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading timeline...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={showHeader} />
      {events.length > 0 && (
        <>
          <SubMenuBar 
            title={timelineTitle} 
            selectedDate={formatSelectedDate(centeredEvent)}
            precedingDate={formatSelectedDate(getPrecedingEvent())}
            followingDate={formatSelectedDate(getFollowingEvent())}
            timelinePosition={getTimelinePosition()}
            headerVisible={showHeader}
          />
        </>
      )}
      <Toaster />
      <main className={`container mx-auto px-0 md:px-3 pb-20 max-w-6xl transition-all duration-300 ${
        showHeader ? 'pt-[56px]' : 'pt-[44px]'
      }`}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">No timelines available. Create one to get started!</p>
          </div>
        ) : (
          <Timeline 
            events={events} 
            pixelsPerYear={30} 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
            onCenteredEventChange={setCenteredEvent}
            onScroll={handleTimelineScroll}
            isLoading={loading}
          />
        )}
      </main>
      {events.length > 0 && (() => {
        const startDate = events.length > 0 ? new Date(Math.min(...events.map(e => new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime()))) : undefined;
        const endDate = events.length > 0 ? new Date(Math.max(...events.map(e => new Date(e.year, (e.month || 12) - 1, e.day || 31).getTime()))) : undefined;
        return (
          <ExperimentalBottomMenuBar
            selectedDate={formatSelectedDate(centeredEvent)}
            timelinePosition={getTimelinePosition()}
            startDate={startDate}
            endDate={endDate}
          />
        );
      })()}
    </div>
  );
};

export default Index;
