import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import { CircularDialTimelineProps } from './types';
import { useTimelineStore } from '../../stores/timelineStore';
import TimelineDot from './TimelineDot';

// Styled components
const SVGContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
`;

// Move styled components outside the main component to prevent recreation on each render
const CircularSVG = styled.svg`
  width: 100%;
  height: 100%;
  margin: 0 auto;
`;

const CenterLabel = styled.text`
  text-anchor: middle;
  dominant-baseline: middle;
  font-size: 14px;
  fill: var(--text-color, #333);
  font-weight: bold;
`;

/**
 * Circular arc component for the timeline background and zoomed section
 */
interface CircularArcProps {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

// Wrap circular arc with React.memo to prevent unnecessary re-renders
const CircularArc = React.memo(({ 
  centerX,
  centerY,
  radius,
  startAngle,
  endAngle,
  color
}: CircularArcProps) => {
  // Adjust the angles to align correctly with SVG coordinate system
  // In this case, we need to add 90 degrees instead of subtracting
  const startAngleAdjusted = startAngle + 90;
  const endAngleAdjusted = endAngle + 90;
  
  const startAngleRad = startAngleAdjusted * (Math.PI / 180);
  const endAngleRad = endAngleAdjusted * (Math.PI / 180);
  
  const arcGenerator = d3.arc<any, any>()
    .innerRadius(radius - 8)
    .outerRadius(radius)
    .startAngle(startAngleRad)
    .endAngle(endAngleRad);
  
  // Use an empty string as fallback if arcGenerator returns null
  const arcPath = arcGenerator({} as any) || '';
  
  return (
    <g transform={`translate(${centerX}, ${centerY})`}>
      <path
        d={arcPath}
        fill={color}
        aria-hidden="true"
      />
    </g>
  );
});

// Wrap angle marker with React.memo to prevent unnecessary re-renders
const AngleMarker = React.memo(({ angle, radius, isSelected }: {
  angle: number; 
  radius: number;
  isSelected: boolean;
}) => {
  const markerSize = isSelected ? 8 : 4;
  const markerX = Math.cos(angle) * radius;
  const markerY = Math.sin(angle) * radius;
  
  return (
    <circle
      cx={markerX}
      cy={markerY}
      r={markerSize}
      fill={isSelected ? "var(--primary-color, #007bff)" : "var(--marker-color, #aaa)"}
    />
  );
});

/**
 * Circular timeline component that displays events in a dial format
 * Uses Zustand for state management
 */
const CircularDialTimeline: React.FC<CircularDialTimelineProps> = ({
  width = 600,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Get data and actions from the store
  const {
    events,
    selectedEventId,
    zoomedTimespan,
    selectEvent
  } = useTimelineStore();
  
  // Calculate dimensions
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  
  // SIMPLIFIED ANGLE CALCULATIONS
  
  // We want a 300 degree arc that goes from 7 o'clock to 5 o'clock positions
  // In SVG/canvas coordinates:
  // 0 degrees = 3 o'clock (east)
  // 90 degrees = 6 o'clock (south)
  // 180 degrees = 9 o'clock (west)
  // 270 degrees = 12 o'clock (north)
  
  // 7 o'clock position is at 120 degrees
  const START_ANGLE = 120;
  // 5 o'clock position is at 60 degrees
  const END_ANGLE = 420; // 60 + 360 to ensure correct clockwise arc
  
  // Ensure events are sorted by date
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);
  
  // Create a scale to map dates to angles
  const dateScale = useMemo(() => {
    if (!sortedEvents || sortedEvents.length < 2) return null;
    
    return d3.scaleTime()
      .domain([
        new Date(sortedEvents[0].date),
        new Date(sortedEvents[sortedEvents.length - 1].date)
      ])
      .range([START_ANGLE, END_ANGLE].map(angle => angle * Math.PI / 180));
  }, [sortedEvents]);
  
  // Calculate event positions
  const eventPositions = useMemo(() => {
    if (!sortedEvents.length || !dateScale) return [];
    
    return sortedEvents.map(event => {
      const angle = dateScale(new Date(event.date));
      const dotDistance = radius + 15; // Position dots outside the arc
      
      // Calculate position
      return {
        event,
        position: {
          x: centerX + Math.cos(angle) * dotDistance,
          y: centerY + Math.sin(angle) * dotDistance
        },
        isFirst: event.id === sortedEvents[0].id,
        isLast: event.id === sortedEvents[sortedEvents.length - 1].id,
        angle
      };
    });
  }, [sortedEvents, dateScale, radius, centerX, centerY]);
  
  // Calculate zoomed section angles in degrees for the CircularArc component
  // REMOVED - Not used anywhere, replaced by memoizedZoomedSectionAngles

  // Enable this for debugging
  const showDebugMarkers = false;
  
  // Optimize with useCallback for event handlers
  const handleEventClick = useCallback((id: string) => {
    selectEvent(id);
  }, [selectEvent]);

  // Only recalculate when events, selectedEventId, or zoomedTimespan changes
  const positionedEvents = useMemo(() => {
    if (!sortedEvents || sortedEvents.length === 0) return [];

    // Use the same START_ANGLE and END_ANGLE constants for consistency
    // Convert to radians for calculations
    const startAngleRad = START_ANGLE * (Math.PI / 180);
    const endAngleRad = END_ANGLE * (Math.PI / 180);

    // Create a scale that maps dates to angles (in radians)
    const dateScale = d3.scaleTime()
      .domain([
        new Date(sortedEvents[0].date), 
        new Date(sortedEvents[sortedEvents.length - 1].date)
      ])
      .range([startAngleRad, endAngleRad]);

    // Calculate dot positions based on angles
    return sortedEvents.map(event => {
      const date = new Date(event.date);
      const angle = dateScale(date);
      const dotDistance = radius + 15; // Position dots outside the arc
      
      // Calculate position based on angle - don't add centerX/centerY as those are handled by SVG transform
      return {
        ...event,
        angle,
        x: Math.cos(angle) * dotDistance,
        y: Math.sin(angle) * dotDistance,
        isSelected: event.id === selectedEventId,
        isInZoomedRange: zoomedTimespan ? 
          (date >= new Date(zoomedTimespan.start) && date <= new Date(zoomedTimespan.end)) : 
          false
      };
    });
  }, [sortedEvents, selectedEventId, zoomedTimespan, radius, START_ANGLE, END_ANGLE]);

  // Extract zoomed section calculations to avoid recalculations on each render
  const memoizedZoomedSectionAngles = useMemo(() => {
    if (!zoomedTimespan || !sortedEvents || sortedEvents.length === 0) return null;
    
    // Use the same START_ANGLE and END_ANGLE constants for consistency
    const timelineStartAngleRad = START_ANGLE * (Math.PI / 180);
    const timelineEndAngleRad = END_ANGLE * (Math.PI / 180);
    
    // Create date scale for the whole timeline
    const dateScale = d3.scaleTime()
      .domain([
        new Date(sortedEvents[0].date),
        new Date(sortedEvents[sortedEvents.length - 1].date)
      ])
      .range([timelineStartAngleRad, timelineEndAngleRad]);
      
    // Calculate start and end angles of zoomed section (in radians)
    const zoomStartAngleRad = dateScale(new Date(zoomedTimespan.start));
    const zoomEndAngleRad = dateScale(new Date(zoomedTimespan.end));
    
    // Convert back to degrees for the CircularArc component
    const startAngle = zoomStartAngleRad * (180 / Math.PI);
    const endAngle = zoomEndAngleRad * (180 / Math.PI);
    
    return { startAngle, endAngle };
  }, [zoomedTimespan, sortedEvents, START_ANGLE, END_ANGLE]);

  return (
    <div style={{ width, height }}>
      <CircularSVG
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-label="Circular timeline"
        role="navigation"
      >
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Main circular timeline */}
          <circle
            cx={0}
            cy={0}
            r={radius}
            fill="none"
            stroke="var(--timeline-bg, #eaeaea)"
            strokeWidth={2}
          />
          
          {/* Zoomed section highlight */}
          {memoizedZoomedSectionAngles && (
            <CircularArc
              centerX={0}
              centerY={0}
              radius={radius}
              startAngle={memoizedZoomedSectionAngles.startAngle}
              endAngle={memoizedZoomedSectionAngles.endAngle}
              color="var(--zoomed-section-color, #a0a0a0)"
            />
          )}
          
          {/* Event markers */}
          {positionedEvents.map((event, index) => (
            <TimelineDot
              key={event.id}
              event={event}
              position={{ x: event.x, y: event.y }}
              isSelected={event.id === selectedEventId}
              onClick={handleEventClick}
            />
          ))}
          
          {/* Center label showing selected event or timeline title */}
          <CenterLabel x={0} y={0}>
            {selectedEventId ? events.find(e => e.id === selectedEventId)?.title : "Timeline"}
          </CenterLabel>
        </g>
      </CircularSVG>
    </div>
  );
};

export default React.memo(CircularDialTimeline); 