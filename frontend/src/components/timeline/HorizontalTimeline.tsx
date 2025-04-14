import React, { useEffect, useRef, useState, useMemo } from 'react';
import styled from 'styled-components';
import { HorizontalTimelineProps } from './types';
import { useTimelineStore } from '../../stores/timelineStore';
import TimelineDot from './TimelineDot';
import * as d3 from 'd3';

// Styled components
const TimelineContainer = styled.div`
  width: 100%;
  padding: 0 20px;
  margin-bottom: 2rem;
  overflow-x: hidden;
  position: relative;
`;

const TimelineWrapper = styled.div<{ offset: number }>`
  width: 100%;
  transition: transform 0.5s ease;
  transform: translateX(${props => props.offset}px);
`;

const SVGContainer = styled.svg`
  width: 100%;
  height: 100px;
  margin: 0 auto;
`;

const EventTitle = styled.text<{ isSelected: boolean }>`
  font-size: ${props => props.isSelected ? '14px' : '12px'};
  font-weight: ${props => props.isSelected ? 'bold' : 'normal'};
  fill: var(--text-color, #333);
  text-anchor: middle;
  pointer-events: none;
  user-select: none;
  transition: font-size 0.3s ease, font-weight 0.3s ease;
`;

const EventLine = styled.line<{ isSelected: boolean }>`
  stroke: ${props => props.isSelected ? 'var(--selected-color, #ff5555)' : 'var(--unselected-color, #ff9999)'};
  stroke-width: ${props => props.isSelected ? '3px' : '2px'};
  transition: stroke 0.3s ease, stroke-width 0.3s ease;
`;

const MainLine = styled.line`
  stroke: var(--timeline-bg, #e0e0e0);
  stroke-width: 2px;
`;

/**
 * Horizontal timeline component that displays a zoomed section of events
 * Uses Zustand for state management
 */
const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  width = 800,
  height = 100
}) => {
  // Get state and actions from store
  const {
    events,
    selectedEventId,
    zoomedTimespan,
    selectEvent,
    recalculateOffset,
  } = useTimelineStore();
  
  // Calculate offset for centering
  const [offsetX, setOffsetX] = useState(0);

  // Reference to the SVG container
  const svgRef = useRef<SVGSVGElement>(null);

  // Timeline Y position
  const timelineY = height / 2;
  
  // Calculate padding and available width
  const padding = 50;
  const availableWidth = width - (padding * 2);

  // Sort events by date
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);
  
  // Get selected event index
  const selectedEventIndex = useMemo(() => {
    return sortedEvents.findIndex(e => e.id === selectedEventId);
  }, [sortedEvents, selectedEventId]);

  // Create a full timeline date scale (from earliest to latest event)
  const fullDateScale = useMemo(() => {
    if (!sortedEvents || sortedEvents.length < 2) return null;
    
    return d3.scaleTime()
      .domain([
        new Date(sortedEvents[0].date),
        new Date(sortedEvents[sortedEvents.length - 1].date)
      ])
      .range([padding, width - padding]);
  }, [sortedEvents, padding, width]);
  
  // Create a zoomed timeline date scale (for the visible section)
  const zoomedDateScale = useMemo(() => {
    if (!zoomedTimespan) return null;
    
    return d3.scaleTime()
      .domain([zoomedTimespan.start, zoomedTimespan.end])
      .range([padding, width - padding]);
  }, [zoomedTimespan, padding, width]);
  
  // Filter events to show only those in the zoomed range
  const filteredEvents = useMemo(() => {
    if (!zoomedTimespan) return [];
    
    return sortedEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= zoomedTimespan.start && eventDate <= zoomedTimespan.end;
    });
  }, [sortedEvents, zoomedTimespan]);
  
  // Ensure we show the selected event and at least 3 events total when possible
  const eventsToShow = useMemo(() => {
    if (!filteredEvents.length) return [];
    
    // If we have a zoomed range and enough events, use that
    if (filteredEvents.length >= 3) {
      return filteredEvents;
    }
    
    // Not enough events in zoomed range, or selected event not in filtered range
    if (selectedEventIndex === 0) {
      // First event selected - show first 3 events (or all if less than 3)
      return sortedEvents.slice(0, Math.min(3, sortedEvents.length));
    } else if (selectedEventIndex === sortedEvents.length - 1) {
      // Last event selected - show last 3 events (or all if less than 3)
      return sortedEvents.slice(Math.max(0, sortedEvents.length - 3));
    } else {
      // Try to center the selected event with one before and one after
      const startIndex = Math.max(0, selectedEventIndex - 1);
      const endIndex = Math.min(sortedEvents.length, startIndex + 3);
      return sortedEvents.slice(startIndex, endIndex);
    }
  }, [filteredEvents, selectedEventIndex, sortedEvents]);
  
  // Position events along the horizontal axis
  const positionedEvents = useMemo(() => {
    if (!eventsToShow.length || !zoomedTimespan) return [];
    
    // Choose the appropriate scale based on whether events are in zoom range
    const scale = zoomedDateScale || fullDateScale;
    if (!scale) return [];
    
    return eventsToShow.map(event => {
      const eventDate = new Date(event.date);
      // Use the scale to determine x position
      const xPosition = scale(eventDate);
      
      return {
        ...event,
        x: xPosition,
        isSelected: event.id === selectedEventId
      };
    });
  }, [eventsToShow, zoomedTimespan, zoomedDateScale, fullDateScale, selectedEventId]);
  
  // Center the timeline on the selected event
  useEffect(() => {
    if (selectedEventId && positionedEvents.length > 0) {
      const selectedEvent = positionedEvents.find(e => e.id === selectedEventId);
      if (selectedEvent) {
        // Calculate offset to center the selected event
        const centerPosition = width / 2;
        const selectedX = selectedEvent.x;
        const offset = centerPosition - selectedX;
        
        // Apply transformation to center the selected event
        setOffsetX(offset);
        
        // Update the store
        recalculateOffset(offset);
      }
    }
  }, [selectedEventId, positionedEvents, width, recalculateOffset]);
  
  if (!zoomedTimespan || positionedEvents.length === 0) {
    return null;
  }
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <TimelineContainer>
      <TimelineWrapper offset={offsetX}>
        <SVGContainer
          width={width}
          height={height}
          aria-label="Horizontal timeline"
          role="navigation"
        >
          {/* Main timeline line */}
          <MainLine
            x1={padding}
            y1={timelineY}
            x2={width - padding}
            y2={timelineY}
          />
          
          {/* Event markers */}
          {positionedEvents.map(event => (
            <g
              key={event.id}
              className={`event-marker-group ${event.isSelected ? 'selected' : ''}`}
              data-event-id={event.id}
            >
              {/* Vertical line for the event */}
              <EventLine
                x1={event.x}
                y1={timelineY - 20}
                x2={event.x}
                y2={timelineY + 20}
                isSelected={event.isSelected}
              />
              
              {/* Event title */}
              <EventTitle
                x={event.x}
                y={timelineY + 35}
                isSelected={event.isSelected}
              >
                {event.title.length > 20 ? `${event.title.substring(0, 17)}...` : event.title}
              </EventTitle>
              
              {/* Use TimelineDot component instead of direct circle rendering */}
              <TimelineDot 
                event={event}
                position={{ x: event.x, y: timelineY }}
                isSelected={event.isSelected}
                onClick={selectEvent}
              />
            </g>
          ))}
          
          {/* Date range indicator */}
          <text
            x={width / 2}
            y={10}
            textAnchor="middle"
            fontSize="12px"
            fill="var(--text-color, #555)"
          >
            {formatDate(zoomedTimespan.start)} - {formatDate(zoomedTimespan.end)}
          </text>
        </SVGContainer>
      </TimelineWrapper>
    </TimelineContainer>
  );
};

export default HorizontalTimeline; 