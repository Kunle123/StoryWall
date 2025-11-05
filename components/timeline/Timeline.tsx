"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TimelineCard } from "./TimelineCard";

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
}

export const Timeline = ({ events, pixelsPerYear = 50, title, viewMode: externalViewMode, onViewModeChange, onSelectedEventChange, onCenteredEventChange, onScroll, isLoading = false, loadMoreRef, isLoadingMore = false, hasMore = false }: TimelineProps) => {
  const [internalViewMode, setInternalViewMode] = useState<"vertical" | "hybrid">("vertical");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  const [centeredCardId, setCenteredCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.year, a.month || 0, a.day || 1);
    const dateB = new Date(b.year, b.month || 0, b.day || 1);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate earliest and latest events
  const earliestEvent = sortedEvents[0];
  const latestEvent = sortedEvents[sortedEvents.length - 1];
  
  const startDate = new Date(earliestEvent?.year || 1886, earliestEvent?.month || 0, earliestEvent?.day || 1);
  const endDate = new Date(latestEvent?.year || 2026, latestEvent?.month || 0, latestEvent?.day || 1);
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

  // Clear selection when user scrolls
  useEffect(() => {
    if (viewMode !== "vertical") return;

    const scrollContainer = document.querySelector('.overflow-y-auto');
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
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
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, [viewMode, onSelectedEventChange]);

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

      for (const [id, card] of cardRefs.current.entries()) {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (!closestCard || distance < closestCard.distance) {
          closestCard = { id, distance };
        }
      }

      if (closestCard !== null) {
        setCenteredCardId((prevId) => {
          // Only update if the ID actually changed to prevent unnecessary re-renders
          if (prevId !== closestCard!.id) {
            return closestCard!.id;
          }
          return prevId;
        });
        
        // Notify parent of centered event (use callback ref to avoid dependency issues)
        if (onCenteredEventChange) {
          const centeredEvent = sortedEvents.find(e => e.id === closestCard!.id);
          onCenteredEventChange(centeredEvent || null);
        }
      }
    };

    // Find centered card on scroll and call onScroll callback
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const handleScroll = () => {
      findCenteredCard();
      if (onScroll && scrollContainer) {
        const currentScrollTop = scrollContainer.scrollTop;
        onScroll(currentScrollTop, lastScrollTopRef.current);
        lastScrollTopRef.current = currentScrollTop;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Use requestAnimationFrame to avoid calling during render
      requestAnimationFrame(() => {
        findCenteredCard();
      });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
    // Remove onCenteredEventChange from dependencies to prevent infinite loop
    // It's a callback that should be stable, but if it changes, we'll still call it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, sortedEvents.length]);

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

  // Vertical View - Full screen timeline
  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-3.5rem)] relative flex">
      {/* Scrollable cards area - Left side with date margin */}
      <div className="flex-1 overflow-y-auto h-full pr-1 md:pr-0 scrollbar-hide">
        <div className="space-y-0.5 pt-0 pb-0 ml-10 mr-1 md:mr-0">
          {sortedEvents.map((event, index) => {
            const isSelected = selectedEventId === event.id;
            const formatDate = () => {
              const formatYear = (y: number) => {
                if (y < 0) return `${Math.abs(y)} BC`;
                if (y === 0) return '1 AD';
                if (y <= 999) return `${y} AD`;
                return y.toString();
              };
              
              if (event.day && event.month) {
                const date = new Date(event.year, event.month - 1, event.day);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                return `${monthName} ${event.day}, ${formatYear(event.year)}`;
              } else if (event.month) {
                const date = new Date(event.year, event.month - 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                return `${monthName} ${formatYear(event.year)}`;
              }
              return formatYear(event.year);
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
                  {/* Date in left margin */}
                  <div className="absolute -left-10 top-6 w-8 text-right">
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
          })}
        </div>
      </div>

      {/* Vertical Timeline - Fixed right side */}
      <div className="absolute md:relative right-[-6px] h-[calc(100%-3.5rem)] w-3 flex-shrink-0 pt-0 pb-0 z-10">
        {/* Timeline container with line, outline, and markers */}
        <div className="relative h-full flex items-center justify-center">
          {/* Main vertical line - 8px, centered */}
          <div className="absolute left-1/2 -translate-x-1/2 w-[8px] bg-border top-0 bottom-0 z-0" />

          {/* Visible cards highlight box */}
          {getVisibleMarkerBox() && (
            <div
              className="absolute w-full bg-primary/80 rounded-full pointer-events-none transition-all duration-500 ease-out z-10"
              style={{
                left: 0,
                top: `${getVisibleMarkerBox()!.top}%`,
                height: `${Math.max(getVisibleMarkerBox()!.height, 2)}%`,
              }}
            />
          )}

          {/* Markers removed per design requirements */}
        </div>
      </div>
    </div>
  );
};
