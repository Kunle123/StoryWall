import { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomMenuBar } from "@/components/BottomMenuBar";
import { Timeline } from "@/components/Timeline";
import { carTimelineEvents } from "@/data/timelineData";

const ExperimentalTimeline = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [centeredEvent, setCenteredEvent] = useState<any>(null);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sort events by full date (year, month, day) for accurate calculations
  const sortedEvents = [...carTimelineEvents].sort((a, b) => {
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

  const handleSelectedEventChange = useCallback((event: any) => {
    setSelectedEvent(event);
  }, []);

  const handleCenteredEventChange = useCallback((event: any) => {
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

  // Calculate start and end dates from sorted events
  const earliestEvent = sortedEvents[0];
  const latestEvent = sortedEvents[sortedEvents.length - 1];
  const startDate = new Date(earliestEvent?.year || 1886, (earliestEvent?.month || 1) - 1, earliestEvent?.day || 1);
  const endDate = new Date(latestEvent?.year || 2026, (latestEvent?.month || 12) - 1, latestEvent?.day || 31);
  const totalTimeSpan = endDate.getTime() - startDate.getTime();

  // Calculate timeline position based on current event's full date within total span
  useEffect(() => {
    if (displayEvent && totalTimeSpan > 0) {
      const eventDate = new Date(displayEvent.year, displayEvent.month || 0, displayEvent.day || 1);
      const timeDiff = eventDate.getTime() - startDate.getTime();
      const position = timeDiff / totalTimeSpan;
      setTimelinePosition(Math.min(Math.max(position, 0), 1));
    }
  }, [displayEvent, startDate, totalTimeSpan]);

  const formatEventDate = (event: any) => {
    if (!event) return undefined;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = event.month ? monthNames[event.month - 1] : '';
    const day = event.day || '';
    
    // Format date without comma if month/day are missing
    if (month && day) {
      return `${month} ${day}, ${event.year}`;
    } else if (month) {
      return `${month} ${event.year}`;
    } else {
      return `${event.year}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16 pb-[110px]">
        <Timeline 
          events={visibleEvents}
          pixelsPerYear={50}
          title="Evolution of Cars"
          onSelectedEventChange={handleSelectedEventChange}
          onCenteredEventChange={handleCenteredEventChange}
          onScroll={handleScroll}
          loadMoreRef={loadMoreRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          allEvents={sortedEvents}
          hideFloatingWidget={true}
        />
      </main>
      <BottomMenuBar 
        selectedDate={formatEventDate(displayEvent)}
        timelinePosition={timelinePosition}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default ExperimentalTimeline;
