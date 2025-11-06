"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelines, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { formatEventDate } from "@/lib/utils/dateFormat";

const ExperimentalTimeline = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("Experimental Timeline");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch timeline data
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);
        const timelinesResult = await fetchTimelines();
        if (timelinesResult.data && timelinesResult.data.length > 0) {
          const firstTimeline = timelinesResult.data[0];
          const timelineId = firstTimeline.id;
          setTimelineTitle(firstTimeline.title || "Experimental Timeline");
          const eventsResult = await fetchEventsByTimelineId(timelineId);
          if (eventsResult.data) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
          }
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, []);

  // Sort events by full date (year, month, day) for accurate calculations
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.year, a.month || 0, a.day || 1);
    const dateB = new Date(b.year, b.month || 0, b.day || 1);
    return dateA.getTime() - dateB.getTime();
  });

  const visibleEvents = sortedEvents.slice(0, visibleCount);
  const hasMore = visibleCount < sortedEvents.length;

  const handleScroll = useCallback((scrollTop: number, lastScrollTop: number) => {
    const currentScrollY = scrollTop;
    
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setHeaderVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setHeaderVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  const handleSelectedEventChange = useCallback((event: TimelineEvent | null) => {
    setSelectedEvent(event);
  }, []);

  const handleCenteredEventChange = useCallback((event: TimelineEvent | null) => {
    setCenteredEvent(event);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 10, sortedEvents.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, sortedEvents.length]);

  const displayEvent = centeredEvent || selectedEvent || sortedEvents[0];
  const currentIndex = sortedEvents.findIndex(e => e.id === displayEvent?.id);
  const precedingEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const followingEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;

  // Calculate start and end dates from sorted events (matching Timeline component logic)
  const earliestEvent = sortedEvents[0];
  const latestEvent = sortedEvents[sortedEvents.length - 1];
  
  // Use same date calculation as Timeline component
  const startDate = earliestEvent ? new Date(earliestEvent.year, earliestEvent.month || 0, earliestEvent.day || 1) : undefined;
  // For endDate, if month/day missing, use last day of year for proper span calculation
  const endDate = latestEvent ? new Date(
    latestEvent.year, 
    latestEvent.month || 11, // December if missing
    latestEvent.day || (latestEvent.month ? new Date(latestEvent.year, latestEvent.month, 0).getDate() : 31) // Last day of month, or Dec 31 if no month
  ) : undefined;
  
  const totalTimeSpan = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;

  // Calculate timeline position based on current event's full date within total span
  useEffect(() => {
    if (displayEvent && totalTimeSpan > 0 && startDate) {
      // Use same date calculation as Timeline component
      const eventDate = new Date(displayEvent.year, displayEvent.month || 0, displayEvent.day || 1);
      const timeDiff = eventDate.getTime() - startDate.getTime();
      const position = timeDiff / totalTimeSpan;
      setTimelinePosition(Math.min(Math.max(position, 0), 1));
    }
  }, [displayEvent, startDate, totalTimeSpan]);

  const formatEventDateForDisplay = (event: TimelineEvent | null) => {
    if (!event) return undefined;
    return formatEventDate(event.year, event.month, event.day);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isVisible={headerVisible} />
      <main className="flex-1 pt-16 pb-[110px]">
        <Timeline 
          events={visibleEvents}
          pixelsPerYear={50}
          title="Experimental Timeline"
          onSelectedEventChange={handleSelectedEventChange}
          onCenteredEventChange={handleCenteredEventChange}
          onScroll={handleScroll}
          loadMoreRef={loadMoreRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          isLoading={loading}
        />
      </main>
      <ExperimentalBottomMenuBar 
        selectedDate={formatEventDateForDisplay(displayEvent)}
        timelinePosition={timelinePosition}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default ExperimentalTimeline;

