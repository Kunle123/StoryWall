import { useState, useEffect, useCallback, useRef } from "react";
import { Timeline, TimelineEvent } from "@/components/Timeline";
import { carTimelineEvents } from "@/data/timelineData";
import { Header } from "@/components/Header";
import { SubMenuBar } from "@/components/SubMenuBar";
import { BottomMenuBar } from "@/components/BottomMenuBar";

const Index = () => {
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedEvents, setDisplayedEvents] = useState<TimelineEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const EVENTS_PER_PAGE = 10;
  
  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedEvents(carTimelineEvents.slice(0, EVENTS_PER_PAGE));
      setIsLoading(false);
      setHasMore(carTimelineEvents.length > EVENTS_PER_PAGE);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Load more events
  const loadMoreEvents = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const currentLength = displayedEvents.length;
      const nextEvents = carTimelineEvents.slice(
        currentLength,
        currentLength + EVENTS_PER_PAGE
      );
      
      setDisplayedEvents(prev => [...prev, ...nextEvents]);
      setHasMore(currentLength + nextEvents.length < carTimelineEvents.length);
      setIsLoadingMore(false);
    }, 1000);
  }, [displayedEvents.length, hasMore, isLoadingMore]);
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || isLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreEvents();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreEvents, isLoading]);
  
  // Format the selected event date
  const formatSelectedDate = (event: TimelineEvent | null) => {
    if (!event) return undefined;
    
    if (event.day && event.month) {
      return new Date(event.year, event.month - 1, event.day).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (event.month) {
      return new Date(event.year, event.month - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    }
  return event.year.toString();
  };

  // Get preceding and following events
  const getPrecedingEvent = () => {
    if (!centeredEvent) return null;
    const currentIndex = carTimelineEvents.findIndex(e => e.id === centeredEvent.id);
    return currentIndex > 0 ? carTimelineEvents[currentIndex - 1] : null;
  };

  const getFollowingEvent = () => {
    if (!centeredEvent) return null;
    const currentIndex = carTimelineEvents.findIndex(e => e.id === centeredEvent.id);
    return currentIndex < carTimelineEvents.length - 1 ? carTimelineEvents[currentIndex + 1] : null;
  };

  // Calculate timeline position as percentage
  const getTimelinePosition = () => {
    if (!centeredEvent) return 0.5;
    const currentIndex = carTimelineEvents.findIndex(e => e.id === centeredEvent.id);
    return currentIndex / (carTimelineEvents.length - 1);
  };

  const handleTimelineScroll = (scrollTop: number, lastScrollTop: number) => {
    if (scrollTop > lastScrollTop && scrollTop > 50) {
      // Scrolling down
      setShowHeader(false);
    } else {
      // Scrolling up
      setShowHeader(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubMenuBar 
        title="Automotive History" 
        selectedDate={formatSelectedDate(centeredEvent)}
        precedingDate={formatSelectedDate(getPrecedingEvent())}
        followingDate={formatSelectedDate(getFollowingEvent())}
        timelinePosition={getTimelinePosition()}
        headerVisible={showHeader}
      />
      <main className="container mx-auto px-0 md:px-3 pt-[56px] pb-20 max-w-6xl">
        <Timeline 
          events={displayedEvents} 
          pixelsPerYear={30} 
          title="Automotive History"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSelectedEventChange={setSelectedEvent}
          onCenteredEventChange={setCenteredEvent}
          onScroll={handleTimelineScroll}
          isLoading={isLoading}
          loadMoreRef={loadMoreRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          allEvents={carTimelineEvents}
        />
      </main>
      <BottomMenuBar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default Index;
