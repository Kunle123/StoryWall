import { useState, useRef, useEffect, useCallback } from "react";
import { TimelineCard } from "./TimelineCard";
import { TimelineCardSkeleton } from "./TimelineCardSkeleton";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { FloatingTimelineWidget } from "./FloatingTimelineWidget";

export interface TimelineEvent {
  id: string;
  year: number;
  month?: number;
  day?: number;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  video?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  pixelsPerYear?: number;
  title?: string;
  viewMode?: "vertical" | "hybrid";
  onViewModeChange?: (mode: "vertical" | "hybrid") => void;
  onSelectedEventChange?: (event: TimelineEvent | null) => void;
  onCenteredEventChange?: (event: TimelineEvent | null) => void;
  onScroll?: (scrollTop: number, lastScrollTop: number) => void;
  isLoading?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  allEvents?: TimelineEvent[]; // Full timeline for calculating date range
}

export const Timeline = ({ events, pixelsPerYear = 50, title, viewMode: externalViewMode, onViewModeChange, onSelectedEventChange, onCenteredEventChange, onScroll, isLoading = false, loadMoreRef, isLoadingMore = false, hasMore = false, allEvents }: TimelineProps) => {
  const [internalViewMode, setInternalViewMode] = useState<"vertical" | "hybrid">("vertical");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  const [centeredCardId, setCenteredCardId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrollTopRef = useRef(0);
  const { toast } = useToast();

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.year, a.month || 0, a.day || 1);
    const dateB = new Date(b.year, b.month || 0, b.day || 1);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate earliest and latest events from the full timeline if available
  const timelineForRange = allEvents && allEvents.length > 0 ? [...allEvents].sort((a, b) => {
    const dateA = new Date(a.year, a.month || 0, a.day || 1);
    const dateB = new Date(b.year, b.month || 0, b.day || 1);
    return dateA.getTime() - dateB.getTime();
  }) : sortedEvents;
  
  const earliestEvent = timelineForRange[0];
  const latestEvent = timelineForRange[timelineForRange.length - 1];
  
  const startDate = new Date(earliestEvent?.year || 1886, (earliestEvent?.month || 1) - 1, earliestEvent?.day || 1);
  const endDate = new Date(latestEvent?.year || 2026, (latestEvent?.month || 12) - 1, latestEvent?.day || 31);
  const totalTimeSpan = endDate.getTime() - startDate.getTime();

  // Calculate position as percentage of timeline height
  const getEventPositionPercent = (event: TimelineEvent) => {
    const eventDate = new Date(event.year, event.month || 0, event.day || 1);
    const timeDiff = eventDate.getTime() - startDate.getTime();
    return (timeDiff / totalTimeSpan) * 100;
  };

  // Group only events at the exact same date/position
  const markerGroups: { position: number; events: TimelineEvent[] }[] = [];
  
  sortedEvents.forEach((event) => {
    const position = getEventPositionPercent(event);
    const existingGroup = markerGroups.find(g => g.position === position);
    
    if (existingGroup) {
      existingGroup.events.push(event);
    } else {
      markerGroups.push({ position, events: [event] });
    }
  });

  const handleMarkerClick = (eventId: string) => {
    const newSelectedId = selectedEventId === eventId ? null : eventId;
    setSelectedEventId(newSelectedId);
    
    // Notify parent of selected event
    if (onSelectedEventChange) {
      const selectedEvent = newSelectedId ? sortedEvents.find(e => e.id === newSelectedId) : null;
      onSelectedEventChange(selectedEvent || null);
    }
    
    // Get the card and scroll container
    const cardElement = cardRefs.current.get(eventId);
    const scrollContainer = cardElement?.closest('.overflow-y-auto');
    
    if (cardElement && scrollContainer) {
      // Get positions
      const containerRect = scrollContainer.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();
      
      // Calculate the center of the container
      const containerCenter = containerRect.height / 2;
      
      // Calculate how much to scroll to center the card
      const cardCenter = cardRect.top - containerRect.top + cardRect.height / 2;
      const scrollOffset = cardCenter - containerCenter;
      
      // Perform the scroll
      scrollContainer.scrollBy({
        top: scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  // Clear selection when user scrolls and check if at bottom
  useEffect(() => {
    if (viewMode !== "vertical") return;

    const scrollContainer = scrollContainerRef.current;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (scrollContainer) {
        // Check if at bottom
        const threshold = 100; // pixels from bottom
        const atBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < threshold;
        setIsAtBottom(atBottom);
        
        if (onScroll) {
          const currentScrollTop = scrollContainer.scrollTop;
          onScroll(currentScrollTop, lastScrollTopRef.current);
          lastScrollTopRef.current = currentScrollTop;
        }
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setSelectedEventId(null);
        if (onSelectedEventChange) {
          onSelectedEventChange(null);
        }
      }, 150); // Clear selection after scrolling stops
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, [viewMode, onScroll, onSelectedEventChange]);

  // Track visible cards using IntersectionObserver
  useEffect(() => {
    if (viewMode !== "vertical") return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCardIds((prev) => {
          const updated = new Set(prev);
          entries.forEach((entry) => {
            const cardId = entry.target.getAttribute("data-card-id");
            if (cardId) {
              if (entry.isIntersecting) {
                updated.add(cardId);
              } else {
                updated.delete(cardId);
              }
            }
          });
          return updated;
        });
      },
      {
        root: null,
        threshold: 0.3, // Card is considered visible when 30% is shown
      }
    );

    cardRefs.current.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [viewMode, sortedEvents]);

  // Track the centered card
  useEffect(() => {
    if (viewMode !== "vertical") return;

    const findCenteredCard = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestCard: { id: string; distance: number } | null = null;

      cardRefs.current.forEach((card, id) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (!closestCard || distance < closestCard.distance) {
          closestCard = { id, distance };
        }
      });

      if (closestCard && closestCard.distance < window.innerHeight) {
        setCenteredCardId(closestCard.id);
        
        // Notify parent of centered event
        if (onCenteredEventChange) {
          const centeredEvent = sortedEvents.find(e => e.id === closestCard.id);
          onCenteredEventChange(centeredEvent || null);
        }
      }
    };

    // Find centered card on scroll
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', findCenteredCard);
      findCenteredCard(); // Initial check
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', findCenteredCard);
      }
    };
  }, [viewMode, sortedEvents, onCenteredEventChange]);

  // Calculate box position based on visible cards
  const getVisibleMarkerBox = useCallback(() => {
    // Build range from currently visible cards
    const visibleEvents = sortedEvents.filter((e) => visibleCardIds.has(e.id));

    let baseMin = 0;
    let baseMax = 0;

    if (visibleEvents.length > 0) {
      const positions = visibleEvents.map((e) => getEventPositionPercent(e));
      baseMin = Math.min(...positions);
      baseMax = Math.max(...positions);
    } else {
      // Fallback small box when nothing is visible yet
      baseMin = 0;
      baseMax = 6;
    }

    const height = Math.max(baseMax - baseMin, 2);

    // Box spans visible cards only
    return {
      top: baseMin,
      bottom: baseMax,
      height,
    };
  }, [visibleCardIds, sortedEvents]);

  if (viewMode === "hybrid") {
    // Generate decade markers for hybrid view
    const earliestYear = sortedEvents[0]?.year || 1886;
    const latestYear = sortedEvents[sortedEvents.length - 1]?.year || 2026;
    const decades: number[] = [];
    const startDecade = Math.floor(earliestYear / 10) * 10;
    const endDecade = Math.ceil(latestYear / 10) * 10;
    for (let decade = startDecade; decade <= endDecade; decade += 10) {
      decades.push(decade);
    }

    if (isLoading) {
      return (
        <div ref={containerRef} className="w-full">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 bg-card">
                <div className="h-6 w-20 bg-muted animate-pulse rounded mb-3" />
                <div className="flex gap-2">
                  <TimelineCardSkeleton />
                  <TimelineCardSkeleton />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="w-full">
        {/* Hybrid View: Vertical Overview */}
        <div className="space-y-2">
          {decades.map((decade) => {
            const decadeEvents = sortedEvents.filter(
              (e) => e.year >= decade && e.year < decade + 10
            );
            if (decadeEvents.length === 0) return null;

            return (
              <div key={decade} className="border rounded-lg p-4 bg-card">
                <h3 className="text-lg font-semibold mb-3">{decade}s</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                  {decadeEvents.map((event, idx) => (
                    <div key={event.id} className="snap-start flex-shrink-0 w-72">
                      <TimelineCard event={event} side={idx % 2 === 0 ? "left" : "right"} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Calculate time difference between events
  const getTimeDifference = (event1: TimelineEvent, event2: TimelineEvent) => {
    const date1 = new Date(event1.year, event1.month || 0, event1.day || 1);
    const date2 = new Date(event2.year, event2.month || 0, event2.day || 1);
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.44);
    const diffYears = Math.floor(diffDays / 365.25);
    
    if (diffYears > 0) {
      return diffYears === 1 ? "1 Year" : `${diffYears} Years`;
    } else if (diffMonths > 0) {
      return diffMonths === 1 ? "1 Month" : `${diffMonths} Months`;
    } else {
      return diffDays === 1 ? "1 Day" : `${diffDays} Days`;
    }
  };

  // Format date for widget display
  const formatDate = (year: number, month?: number, day?: number) => {
    if (day && month) {
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (month) {
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }
    return year.toString();
  };

  // Get widget data for centered event
  const centeredEvent = centeredCardId ? sortedEvents.find(e => e.id === centeredCardId) : sortedEvents[0];
  const centeredIndex = centeredEvent ? sortedEvents.findIndex(e => e.id === centeredEvent.id) : 0;
  const hasPrev = centeredIndex > 0;
  const hasNext = centeredIndex < sortedEvents.length - 1;
  
  const selectedDate = centeredEvent ? formatDate(centeredEvent.year, centeredEvent.month, centeredEvent.day) : undefined;
  const precedingDate = hasPrev ? formatDate(sortedEvents[centeredIndex - 1].year, sortedEvents[centeredIndex - 1].month, sortedEvents[centeredIndex - 1].day) : undefined;
  const followingDate = hasNext ? formatDate(sortedEvents[centeredIndex + 1].year, sortedEvents[centeredIndex + 1].month, sortedEvents[centeredIndex + 1].day) : undefined;
  const timelinePosition = sortedEvents.length > 1 ? centeredIndex / (sortedEvents.length - 1) : 0.5;

  // Vertical View - Full screen timeline
  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-3.5rem)] relative flex">
      {/* Floating Timeline Widget */}
      {viewMode === "vertical" && sortedEvents.length > 0 && (
        <FloatingTimelineWidget
          selectedDate={selectedDate}
          precedingDate={precedingDate}
          followingDate={followingDate}
          timelinePosition={timelinePosition}
          collapsed={isAtBottom}
          startDate={startDate}
          endDate={endDate}
        />
      )}
      {/* Scrollable cards area - Left side with date margin */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto h-full scrollbar-hide">
        <div className="space-y-0.5 pt-0 pb-0 ml-0 md:ml-10 mr-0">
          {isLoading ? (
            <>
              <TimelineCardSkeleton />
              <TimelineCardSkeleton />
              <TimelineCardSkeleton />
              <TimelineCardSkeleton />
              <TimelineCardSkeleton />
            </>
          ) : (
            sortedEvents.map((event, index) => {
            const isSelected = selectedEventId === event.id;
            const formatDate = () => {
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
            
            return (
              <div key={`card-wrapper-${event.id}`}>
                <div
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(event.id, el);
                    } else {
                      cardRefs.current.delete(event.id);
                    }
                  }}
                  data-card-id={event.id}
                  className="relative"
                >
                  {/* Date in left margin - hidden on mobile, shown on md+ */}
                  <div className="hidden md:block absolute -left-10 top-6 w-8 text-right">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {formatDate()}
                    </span>
                  </div>
                  
                  <TimelineCard 
                    event={event} 
                    side="left"
                    isHighlighted={isSelected}
                    isSelected={isSelected}
                    isCentered={centeredCardId === event.id}
                  />
                </div>
                
                {/* Time difference indicator */}
                {index < sortedEvents.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <span className="text-[11px] text-muted-foreground">
                      {getTimeDifference(event, sortedEvents[index + 1])}
                    </span>
                  </div>
                )}
                </div>
              );
            })
          )}
          
          {/* Load more trigger */}
          {!isLoading && hasMore && (
            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && (
                <div className="space-y-0.5">
                  <TimelineCardSkeleton />
                  <TimelineCardSkeleton />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
