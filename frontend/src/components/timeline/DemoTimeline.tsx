import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import { TimelineData } from './types';

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const TimelineSection = styled.section`
  margin-bottom: 40px;
`;

const SVGContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
`;

const HorizontalContainer = styled.div`
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

const EventDetailContainer = styled.div`
  background-color: var(--card-bg, #f9f9f9);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 30px;
`;

const EventTitle = styled.h2`
  font-size: 1.8rem;
  color: var(--heading-color, #333);
  margin-bottom: 15px;
`;

const EventDate = styled.p`
  font-size: 1.1rem;
  color: var(--secondary-color, #666);
  margin-bottom: 15px;
`;

const EventDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color, #444);
  margin-bottom: 20px;
`;

const EventImage = styled.img`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 15px;
`;

const EventMedia = styled.div`
  margin-top: 20px;
`;

const EventVideo = styled.video`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 15px;
`;

const EventMetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
`;

const MetaItem = styled.div`
  background-color: var(--tag-bg, #f0f0f0);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--tag-text, #555);
`;

interface DemoTimelineProps {
  timelineData: TimelineData;
  width?: number;
  height?: number;
}

// Create a helper function to initialize the timespan between events
const calculateTimespan = (events: any[]) => {
  if (events.length < 2) return { start: new Date(), end: new Date() };
  
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return {
    start: new Date(sortedEvents[0].date),
    end: new Date(sortedEvents[sortedEvents.length - 1].date)
  };
};

const DemoTimeline: React.FC<DemoTimelineProps> = ({
  timelineData,
  width = window.innerWidth * 0.9,
  height = 500
}) => {
  // DOM References
  const containerRef = useRef<HTMLDivElement>(null);
  const circularSvgRef = useRef<SVGSVGElement>(null);
  const horizontalSvgRef = useRef<SVGSVGElement>(null);
  
  // Derived state
  const sortedEvents = [...timelineData.events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Combined state object to avoid disjointed state updates
  const [state, setState] = useState({
    selectedEventId: sortedEvents.length > 0 ? sortedEvents[0].id : null,
    offsetX: 0,
    dimensions: {
      width: width > 1200 ? 1200 : width,
      circleHeight: Math.min(500, width * 0.8),
      horizontalHeight: 100
    },
    zoomedRange: null as { start: Date, end: Date } | null,
    lastUpdateTime: Date.now() // Track when the last update happened
  });
  
  // Initialize the selected event and calculate zoomed range once on mount
  useEffect(() => {
    if (sortedEvents.length === 0) return;
    
    // Get timespan
    const timespan = calculateTimespan(sortedEvents);
    const totalTimeMs = timespan.end.getTime() - timespan.start.getTime();
    const zoomTimeMs = totalTimeMs * 0.1; // 10% of total time
    
    // Find the first event
    const firstEvent = sortedEvents[0];
    const firstEventDate = new Date(firstEvent.date);
    
    // Initialize with first event selected
    setState(prev => ({
      ...prev,
      selectedEventId: firstEvent.id,
      zoomedRange: {
        start: firstEventDate,
        end: new Date(firstEventDate.getTime() + zoomTimeMs)
      }
    }));
  }, [sortedEvents]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      
      setState(prev => ({
        ...prev,
        dimensions: {
          width: containerWidth,
          circleHeight: Math.min(500, containerWidth * 0.8),
          horizontalHeight: 100
        },
        lastUpdateTime: Date.now()
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle event selection - this is the only place we modify selectedEventId
  const handleSelectEvent = (eventId: string) => {
    if (!eventId || eventId === state.selectedEventId) return;
    
    console.log("Selecting event:", eventId);
    
    // Find the selected event
    const selectedEvent = sortedEvents.find(e => e.id === eventId);
    if (!selectedEvent) return;
    
    // Calculate new zoomed range based on selected event
    const timespan = calculateTimespan(sortedEvents);
    const totalTimeMs = timespan.end.getTime() - timespan.start.getTime();
    const zoomTimeMs = totalTimeMs * 0.1; // 10% of total time
    
    const selectedDate = new Date(selectedEvent.date);
    const halfZoomMs = zoomTimeMs / 2;
    
    // Calculate reasonable start and end times
    let startDate = new Date(selectedDate.getTime() - halfZoomMs);
    let endDate = new Date(selectedDate.getTime() + halfZoomMs);
    
    // Clamp to available timespan
    if (startDate < timespan.start) {
      startDate = timespan.start;
      endDate = new Date(startDate.getTime() + zoomTimeMs);
    } else if (endDate > timespan.end) {
      endDate = timespan.end;
      startDate = new Date(endDate.getTime() - zoomTimeMs);
    }
    
    // Update state in a single batch to avoid cascading renders
    setState(prev => ({
      ...prev,
      selectedEventId: eventId,
      zoomedRange: { start: startDate, end: endDate },
      lastUpdateTime: Date.now()
    }));
  };
  
  // Render circular timeline using useLayoutEffect to avoid visual flickers
  useLayoutEffect(() => {
    if (!circularSvgRef.current || sortedEvents.length === 0 || !state.selectedEventId) return;
    
    // Clear previous content
    const svg = d3.select(circularSvgRef.current);
    svg.selectAll('*').remove();
    
    const { width, circleHeight } = state.dimensions;
    const centerX = width / 2;
    const centerY = circleHeight / 2;
    const radius = Math.min(width, circleHeight) / 2 - 40;
    
    // Angle configurations
    const startAngle = 210 * (Math.PI / 180); // 30 degrees from bottom left (7 o'clock)
    const endAngle = 510 * (Math.PI / 180);   // 30 degrees from bottom right (5 o'clock)
    
    // Create time scale
    const timespan = calculateTimespan(sortedEvents);
    const dateScale = d3.scaleTime()
      .domain([timespan.start, timespan.end])
      .range([startAngle, endAngle]);
    
    // Draw background arc
    const dialGroup = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);
    
    const arcGenerator = d3.arc<any, any>()
      .innerRadius(radius - 8)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);
    
    dialGroup.append('path')
      .attr('d', arcGenerator({} as any))
      .attr('fill', 'var(--timeline-bg, #e0e0e0)')
      .attr('aria-hidden', 'true');
    
    // Draw zoomed section indicator
    if (state.zoomedRange) {
      const zoomStartAngle = dateScale(state.zoomedRange.start);
      const zoomEndAngle = dateScale(state.zoomedRange.end);
      
      const zoomedArcGenerator = d3.arc<any, any>()
        .innerRadius(radius - 8)
        .outerRadius(radius)
        .startAngle(Math.min(zoomStartAngle, zoomEndAngle))
        .endAngle(Math.max(zoomStartAngle, zoomEndAngle));
      
      dialGroup.append('path')
        .attr('d', zoomedArcGenerator({} as any))
        .attr('fill', 'var(--zoomed-section-color, #a0a0a0)')
        .attr('aria-hidden', 'true');
    }
    
    // Draw event dots
    const dotsGroup = svg.append('g');
    
    sortedEvents.forEach((event, index) => {
      const eventDate = new Date(event.date);
      const angle = dateScale(eventDate);
      const isSelected = event.id === state.selectedEventId;
      
      // Calculate position
      const dotRadius = isSelected ? 8 : 5;
      const dotDistance = radius + 15;
      const adjustedAngle = angle - (Math.PI / 2); // Offset to match standard unit circle
      
      const x = centerX + Math.cos(adjustedAngle) * dotDistance;
      const y = centerY + Math.sin(adjustedAngle) * dotDistance;
      
      // Create dot group
      const dotGroup = dotsGroup.append('g')
        .attr('class', `event-dot-group ${isSelected ? 'selected' : ''}`)
        .attr('data-event-id', event.id)
        .attr('tabindex', 0)
        .attr('aria-label', `Event: ${event.title}, ${eventDate.toLocaleDateString()}`)
        .attr('role', 'button');
      
      // Add visible dot
      dotGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', dotRadius)
        .attr('fill', isSelected ? 'var(--selected-color, #ff5555)' : 'var(--unselected-color, #ff9999)')
        .style('cursor', 'pointer');
      
      // Add hit area for easier clicking
      const hitArea = dotGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 15) // Larger hit area
        .attr('fill', 'transparent')
        .style('cursor', 'pointer');
      
      // Add click handler
      hitArea.node()?.addEventListener('click', () => {
        handleSelectEvent(event.id);
      });
      
      // Add labels for first and last events
      if (index === 0 || index === sortedEvents.length - 1) {
        const labelDistance = dotDistance + 15;
        const labelX = centerX + Math.cos(adjustedAngle) * labelDistance;
        const labelY = centerY + Math.sin(adjustedAngle) * labelDistance;
        
        const textAnchor = Math.cos(adjustedAngle) > 0 ? "start" : "end";
        
        dotsGroup.append('text')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', textAnchor)
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', 'var(--text-color, #333)')
          .text(index === 0 ? 'Start' : 'End');
      }
    });
  }, [sortedEvents, state.selectedEventId, state.dimensions, state.zoomedRange]);
  
  // Render horizontal timeline and calculate centering offset
  useLayoutEffect(() => {
    if (!horizontalSvgRef.current || !state.zoomedRange || sortedEvents.length === 0) return;
    
    // Clear previous content
    const svg = d3.select(horizontalSvgRef.current);
    svg.selectAll('*').remove();
    
    const { width, horizontalHeight } = state.dimensions;
    const padding = 50;
    const timelineY = horizontalHeight / 2;
    
    // Filter events in zoomed range
    const filteredEvents = sortedEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= state.zoomedRange!.start && eventDate <= state.zoomedRange!.end;
    });
    
    // Create time scale
    const timeScale = d3.scaleTime()
      .domain([state.zoomedRange.start, state.zoomedRange.end])
      .range([padding, width - padding]);
    
    // Draw main timeline line
    svg.append('line')
      .attr('x1', padding)
      .attr('y1', timelineY)
      .attr('x2', width - padding)
      .attr('y2', timelineY)
      .attr('stroke', 'var(--timeline-bg, #e0e0e0)')
      .attr('stroke-width', 2);
    
    // Draw events
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const isSelected = event.id === state.selectedEventId;
      const x = timeScale(eventDate);
      
      // Draw vertical line
      svg.append('line')
        .attr('x1', x)
        .attr('y1', timelineY - 20)
        .attr('x2', x)
        .attr('y2', timelineY + 20)
        .attr('stroke', isSelected ? 'var(--selected-color, #ff5555)' : 'var(--unselected-color, #ff9999)')
        .attr('stroke-width', isSelected ? 3 : 2);
      
      // Draw title
      svg.append('text')
        .attr('x', x)
        .attr('y', timelineY + 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', isSelected ? '14px' : '12px')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('fill', 'var(--text-color, #333)')
        .text(event.title.length > 20 ? `${event.title.substring(0, 17)}...` : event.title);
      
      // Draw dot
      svg.append('circle')
        .attr('cx', x)
        .attr('cy', timelineY)
        .attr('r', isSelected ? 6 : 3)
        .attr('fill', isSelected ? 'var(--selected-color, #ff5555)' : 'var(--unselected-color, #ff9999)');
      
      // Add hit area
      const hitArea = svg.append('circle')
        .attr('cx', x)
        .attr('cy', timelineY)
        .attr('r', 15)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer');
      
      // Add click handler
      hitArea.node()?.addEventListener('click', () => {
        handleSelectEvent(event.id);
      });
    });
    
    // Calculate centering offset for the selected event
    if (state.selectedEventId) {
      const selectedEvent = sortedEvents.find(e => e.id === state.selectedEventId);
      if (selectedEvent) {
        const eventDate = new Date(selectedEvent.date);
        
        // Only center if event is in zoomed range
        if (eventDate >= state.zoomedRange.start && eventDate <= state.zoomedRange.end) {
          const x = timeScale(eventDate);
          const centerX = width / 2;
          const newOffset = centerX - x;
          
          // Update offset if it has changed significantly
          if (Math.abs(state.offsetX - newOffset) > 1) {
            setState(prev => ({
              ...prev,
              offsetX: newOffset
            }));
          }
        }
      }
    }
    
    // Show date range
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-color, #555)')
      .text(`${state.zoomedRange.start.toLocaleDateString()} - ${state.zoomedRange.end.toLocaleDateString()}`);
      
  }, [sortedEvents, state.selectedEventId, state.dimensions, state.zoomedRange, state.offsetX]);
  
  // Get the selected event for display
  const selectedEvent = sortedEvents.find(event => event.id === state.selectedEventId) || sortedEvents[0];
  
  // Format date for display
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Container ref={containerRef}>
      <TimelineSection>
        <SVGContainer>
          <svg 
            ref={circularSvgRef} 
            width={state.dimensions.width} 
            height={state.dimensions.circleHeight}
            aria-label="Circular timeline visualization"
            role="img"
          />
        </SVGContainer>
      </TimelineSection>
      
      <TimelineSection>
        <HorizontalContainer>
          <TimelineWrapper offset={state.offsetX}>
            <svg 
              ref={horizontalSvgRef} 
              width={state.dimensions.width} 
              height={state.dimensions.horizontalHeight}
              aria-label="Horizontal timeline"
              role="navigation"
            />
          </TimelineWrapper>
        </HorizontalContainer>
      </TimelineSection>
      
      {selectedEvent && (
        <TimelineSection>
          <EventDetailContainer>
            <EventTitle>{selectedEvent.title}</EventTitle>
            <EventDate>{formatDate(selectedEvent.date)}</EventDate>
            
            <EventMetaInfo>
              {selectedEvent.category && (
                <MetaItem>{selectedEvent.category}</MetaItem>
              )}
              {selectedEvent.location && (
                <MetaItem>{selectedEvent.location}</MetaItem>
              )}
            </EventMetaInfo>
            
            <EventDescription>{selectedEvent.description}</EventDescription>
            
            <EventMedia>
              {selectedEvent.imageUrl && (
                <EventImage src={selectedEvent.imageUrl} alt={selectedEvent.title} />
              )}
              
              {selectedEvent.videoUrl && (
                <EventVideo src={selectedEvent.videoUrl} controls />
              )}
            </EventMedia>
          </EventDetailContainer>
        </TimelineSection>
      )}
    </Container>
  );
};

export default DemoTimeline; 