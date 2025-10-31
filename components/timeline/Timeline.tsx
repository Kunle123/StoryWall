"use client";

import { useState, useRef } from "react";
import { TimelineCard } from "./TimelineCard";
import { Button } from "@/components/ui/button";

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
}

export const Timeline = ({ events, pixelsPerYear = 50 }: TimelineProps) => {
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoom = 1; // Fixed zoom level

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.year, a.month || 0, a.day || 1);
    const dateB = new Date(b.year, b.month || 0, b.day || 1);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate earliest and latest years
  const earliestYear = sortedEvents[0]?.year || 1886;
  const latestYear = sortedEvents[sortedEvents.length - 1]?.year || 2026;

  // Generate decade markers
  const decades: number[] = [];
  const startDecade = Math.floor(earliestYear / 10) * 10;
  const endDecade = Math.ceil(latestYear / 10) * 10;
  for (let decade = startDecade; decade <= endDecade; decade += 10) {
    decades.push(decade);
  }

  // Calculate position for each event
  const getEventPosition = (event: TimelineEvent) => {
    const eventDate = new Date(event.year, event.month || 0, event.day || 1);
    const startDate = new Date(earliestYear, 0, 1);
    const yearDiff = (eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return yearDiff * pixelsPerYear * zoom;
  };

  const handleDotClick = (eventId: string) => {
    const isAlreadySelected = selectedEventId === eventId;
    setSelectedEventId(isAlreadySelected ? null : eventId);
    
    if (!isAlreadySelected && containerRef.current) {
      const event = sortedEvents.find(e => e.id === eventId);
      if (event) {
        const position = getEventPosition(event);
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const targetPosition = scrollTop + containerTop + position - window.innerHeight / 2;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  if (viewMode === "hybrid") {
    return (
      <div ref={containerRef} className="w-full">
        {/* Mode Toggle - Fixed at bottom */}
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-[200] bg-background/95 backdrop-blur-sm py-1.5 px-3 rounded-lg border border-border/50 shadow-lg">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => setViewMode("vertical")}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="h-7 text-xs"
            >
              Vertical
            </Button>
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant="default"
              onClick={() => setViewMode("hybrid")}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="h-7 text-xs"
            >
              Hybrid
            </Button>
          </div>
        </div>

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

  // Detect overlapping cards - only stack when cards would actually overlap
  const OVERLAP_THRESHOLD = 60;
  const cardGroups: number[][] = [];
  let currentGroup: number[] = [];

  sortedEvents.forEach((event, index) => {
    const position = getEventPosition(event);
    
    if (currentGroup.length === 0) {
      currentGroup.push(index);
    } else {
      const lastIndex = currentGroup[currentGroup.length - 1];
      const lastPosition = getEventPosition(sortedEvents[lastIndex]);
      
      if (position - lastPosition < OVERLAP_THRESHOLD) {
        currentGroup.push(index);
      } else {
        cardGroups.push([...currentGroup]);
        currentGroup = [index];
      }
    }
  });
  
  if (currentGroup.length > 0) {
    cardGroups.push(currentGroup);
  }

  // Vertical View with proportional spacing and stacking
  return (
    <div ref={containerRef} className="w-full overflow-visible">
      {/* Mode Toggle - Fixed at bottom */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-[200] bg-background/95 backdrop-blur-sm py-1.5 px-3 rounded-lg border border-border/50 shadow-lg">
        <div className="flex gap-2 items-center">
          <Button
            // @ts-ignore - Type inference issue with class-variance-authority
            variant="default"
            onClick={() => setViewMode("vertical")}
            // @ts-ignore - Type inference issue with class-variance-authority
            size="sm"
            className="h-7 text-xs"
          >
            Vertical
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode("hybrid")}
            // @ts-ignore - Type inference issue with class-variance-authority
            size="sm"
            className="h-7 text-xs"
          >
            Hybrid
          </Button>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative w-full pb-8 pl-12 md:pl-24">
        {/* Left vertical line */}
        <div className="absolute left-6 md:left-12 w-0.5 bg-border h-full" />

        {/* Decade markers */}
        {decades.map((decade) => {
          const position = getEventPosition({ id: "", year: decade, title: "" });
          return (
            <div
              key={decade}
              className="absolute left-6 md:left-12 transform -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${position}px` }}
            >
              <div className="bg-primary text-primary-foreground px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-semibold shadow-md whitespace-nowrap">
                {decade}s
              </div>
            </div>
          );
        })}

        {/* Timeline events with stacking */}
        {cardGroups.map((group) => {
          const groupLeaderIndex = group[group.length - 1];
          const groupPosition = getEventPosition(sortedEvents[groupLeaderIndex]);

          return (
            <div
              key={`group-${group[0]}`}
              className="absolute left-16 md:left-28 pr-2"
              style={{
                top: `${groupPosition}px`,
                width: 'calc(100% - 6rem)',
              }}
            >
              {group.map((eventIndex, stackIndex) => {
                const event = sortedEvents[eventIndex];
                const isLeader = stackIndex === group.length - 1;
                const stackDepth = group.length - 1 - stackIndex;
                const isHighlighted = selectedEventId === event.id;
                
                return (
                  <div
                    key={event.id}
                    className="absolute transition-all duration-300 hover:z-50"
                    style={{
                      top: `${-stackDepth * 8}px`,
                      left: `${-stackDepth * 12}px`,
                      transform: `scale(${1 - stackDepth * 0.05})`,
                      opacity: isHighlighted ? 1 : 1 - stackDepth * 0.15,
                      zIndex: isHighlighted ? 100 : isLeader ? 10 : 10 - stackDepth,
                    }}
                  >
                    <TimelineCard 
                      event={event} 
                      side="left" 
                      isStacked={!isLeader} 
                      stackDepth={stackDepth}
                      isHighlighted={isHighlighted}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Connection dots */}
        {sortedEvents.map((event) => {
          const position = getEventPosition(event);
          const isSelected = selectedEventId === event.id;
          const dotColorClass = event.category === "vehicle" 
            ? "bg-primary" 
            : event.category === "crisis" 
            ? "bg-destructive" 
            : "bg-accent";
          const ringColorClass = event.category === "vehicle" 
            ? "ring-primary/30" 
            : event.category === "crisis" 
            ? "ring-destructive/30" 
            : "ring-accent/30";
          const hoverColorClass = event.category === "vehicle" 
            ? "hover:bg-primary/80" 
            : event.category === "crisis" 
            ? "hover:bg-destructive/80" 
            : "hover:bg-accent/80";
          
          return (
            <div
              key={`dot-${event.id}`}
              onClick={() => handleDotClick(event.id)}
              className={`absolute left-6 md:left-12 transform -translate-x-1/2 rounded-full border-2 border-background shadow-md cursor-pointer transition-all duration-300 hover:scale-150 ${dotColorClass} ${
                isSelected 
                  ? `w-4 h-4 ring-4 ${ringColorClass} scale-125` 
                  : `w-3 h-3 ${hoverColorClass}`
              }`}
              style={{ top: `${position}px` }}
            />
          );
        })}

        {/* Bottom spacer based on last event position */}
        <div style={{ height: `${getEventPosition(sortedEvents[sortedEvents.length - 1]) + 200}px` }} />
      </div>
    </div>
  );
};

