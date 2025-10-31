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
}

export const Timeline = ({ events, pixelsPerYear = 50, title, viewMode: externalViewMode, onViewModeChange }: TimelineProps) => {
  const [internalViewMode, setInternalViewMode] = useState<"vertical" | "hybrid">("vertical");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  const [centeredCardId, setCenteredCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    setSelectedEventId(selectedEventId === eventId ? null : eventId);
    
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
  }, [viewMode, sortedEvents]);

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

  // Vertical View - Full screen timeline
  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-3.5rem)] relative flex">
      {/* Vertical Timeline - Fixed left side */}
      <div className="relative h-full pl-4 flex-shrink-0 pt-8 pb-0">
        {/* Main vertical line - 8px */}
        <div className="absolute left-2 w-[8px] bg-border top-0 bottom-0" />

        {/* Visible cards highlight box */}
        {getVisibleMarkerBox() && (
          <div
            className="absolute w-3 border-l-2 border-r-2 border-orange-500/60 pointer-events-none transition-all duration-500 ease-out transform -translate-x-1/2"
            style={{
              left: 'calc(0.5rem + 4px)',
              top: `${getVisibleMarkerBox()!.top}%`,
              height: `${Math.max(getVisibleMarkerBox()!.height, 2)}%`,
            }}
          />
        )}

        {/* Square markers with overlap counts */}
        {markerGroups.map((group, idx) => {
          const isSelected = group.events.some(e => e.id === selectedEventId);
          const isCentered = group.events.some(e => e.id === centeredCardId);
          const showCount = group.events.length > 1;
          
          const markerColorClass = isCentered ? "bg-orange-500" : isSelected ? "bg-orange-500" : "bg-muted-foreground";
          
          return (
            <div
              key={`marker-${idx}`}
              className="absolute"
              style={{ 
                left: 'calc(0.5rem + 4px)', // Center of the 8px timeline
                top: `${group.position}%` 
              }}
            >
              {/* Larger touch target wrapper */}
              <div
                onClick={() => handleMarkerClick(group.events[0].id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer p-3"
              >
                {/* Square marker - 8px width, truly centered on timeline */}
                <div
                  className={`w-[8px] h-[8px] transition-all duration-300 hover:scale-150 ${markerColorClass} ${
                    isCentered ? 'w-[12px] h-[12px] scale-150 shadow-lg shadow-orange-500/50' : isSelected ? 'w-[10px] h-[10px] scale-125' : ''
                  }`}
                />
              </div>
              
              {/* Overlap count */}
              {showCount && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-foreground">
                  {group.events.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable cards area - Right side */}
      <div className="flex-1 overflow-y-auto h-full">
        <div className="space-y-0 pt-8 pb-0">
          {sortedEvents.map((event) => {
            const isSelected = selectedEventId === event.id;
            
            return (
              <div
                key={`card-${event.id}`}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(event.id, el);
                  } else {
                    cardRefs.current.delete(event.id);
                  }
                }}
                data-card-id={event.id}
              >
                <TimelineCard 
                  event={event} 
                  side="left"
                  isHighlighted={isSelected}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
