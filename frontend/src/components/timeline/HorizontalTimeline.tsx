import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  importance: number;
}

interface Timeline {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  events: Event[];
}

interface HorizontalTimelineProps {
  timeline: Timeline;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  timeline,
  selectedEvent,
  onEventSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Set mobile state on initial render and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  useEffect(() => {
    if (!svgRef.current || !timeline.events.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements
    
    // Get container dimensions
    const container = containerRef.current;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = isMobile ? 60 : 70; // Increased height for better touch targets
    
    // Timeline bar dimensions
    const barHeight = isMobile ? 8 : 12;
    const barY = height / 2 - barHeight / 2;
    
    // Create time scale
    const startDate = new Date(timeline.start_date);
    const endDate = new Date(timeline.end_date);
    
    const timeScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([20, width - 20]); // Margin on both sides
    
    // Draw main timeline bar
    svg.append("rect")
      .attr("x", 20)
      .attr("y", barY)
      .attr("width", width - 40)
      .attr("height", barHeight)
      .attr("fill", "#D0D0D0")
      .attr("rx", barHeight / 2) // Fully rounded ends
      .attr("ry", barHeight / 2);
    
    // Add start year label
    svg.append("text")
      .attr("x", 10)
      .attr("y", barY + barHeight / 2)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("font-size", isMobile ? "12px" : "14px")
      .attr("font-weight", "bold")
      .attr("fill", "var(--text-secondary)")
      .text(timeline.start_date);
    
    // Add end year label
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", barY + barHeight / 2)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .attr("font-size", isMobile ? "12px" : "14px")
      .attr("fill", "var(--text-secondary)")
      .text(timeline.end_date);
    
    // Add event markers
    timeline.events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= startDate && eventDate <= endDate) {
        const eventX = timeScale(eventDate);
        const isSelected = selectedEvent && selectedEvent.id === event.id;
        
        // Event dot
        const markerSize = isSelected ? (isMobile ? 5 : 7) : (isMobile ? 3 : 5);
        const markerColor = isSelected ? "var(--primary-color)" : "var(--secondary-color)";
        
        svg.append("circle")
          .attr("cx", eventX)
          .attr("cy", barY + barHeight / 2)
          .attr("r", markerSize)
          .attr("fill", markerColor)
          .attr("stroke", isSelected ? "var(--primary-dark)" : "transparent")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("click", () => onEventSelect(event));
      }
    });
    
    // Draw position indicator for selected event
    if (selectedEvent) {
      const eventDate = new Date(selectedEvent.date);
      if (eventDate >= startDate && eventDate <= endDate) {
        const indicatorX = timeScale(eventDate);
        
        // Vertical indicator line
        svg.append("line")
          .attr("x1", indicatorX)
          .attr("y1", barY - 4)
          .attr("x2", indicatorX)
          .attr("y2", barY + barHeight + 4)
          .attr("stroke", "var(--primary-color)")
          .attr("stroke-width", 2);
        
        // Event label for selected event
        if (!isMobile) {
          const labelY = barY + barHeight + 18;
          
          // Background for better readability
          const labelText = selectedEvent.title.length > 20 
            ? selectedEvent.title.substring(0, 20) + '...' 
            : selectedEvent.title;
          
          const textWidth = labelText.length * 6; // Approximate width
          
          svg.append("rect")
            .attr("x", indicatorX - textWidth / 2 - 5)
            .attr("y", labelY - 12)
            .attr("width", textWidth + 10)
            .attr("height", 20)
            .attr("fill", "var(--card-background)")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("stroke", "var(--divider-color)")
            .attr("stroke-width", 1);
          
          svg.append("text")
            .attr("x", indicatorX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "var(--text-primary)")
            .text(labelText);
        }
      }
    }
    
    // Make timeline interactive
    const interactionRect = svg.append("rect")
      .attr("x", 0)
      .attr("y", barY - 15)
      .attr("width", width)
      .attr("height", barHeight + 30) // Larger touch target
      .attr("fill", "transparent")
      .style("cursor", "pointer");

    // Handle mouse/touch interaction
    const handleInteraction = function(event: any) {
      // Don't handle if we're in the middle of a drag operation
      if (isDragging) return;
      
      // Get interaction position and convert to date
      const interactionX = d3.pointer(event)[0];
      const clickDate = timeScale.invert(interactionX);
      
      // Find the nearest event
      if (timeline.events.length > 0) {
        const nearestEvent = findNearestEvent(clickDate, timeline.events);
        if (nearestEvent) {
          onEventSelect(nearestEvent);
        }
      }
    };
    
    // Add mouse events
    interactionRect
      .on("click", handleInteraction);
      
    // Add touch events
    interactionRect
      .on("touchend", (event: TouchEvent) => {
        if (!isDragging) {
          handleInteraction(event);
        }
        setIsDragging(false);
      });
    
    // Set the SVG height
    svgRef.current.setAttribute("height", String(height));
    
  }, [timeline, selectedEvent, onEventSelect, isMobile, isDragging]);
  
  // Helper function to find the nearest event to a given date
  const findNearestEvent = (date: Date, events: Event[]) => {
    let nearestEvent = null;
    let minDiff = Number.MAX_VALUE;
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const diff = Math.abs(eventDate.getTime() - date.getTime());
      
      if (diff < minDiff) {
        minDiff = diff;
        nearestEvent = event;
      }
    });
    
    return nearestEvent;
  };
  
  // Touch event handlers for drag detection
  const handleTouchStart = () => {
    setIsDragging(false);
  };
  
  const handleTouchMove = () => {
    setIsDragging(true);
  };
  
  return (
    <Container 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <SVG 
        ref={svgRef} 
        width="100%" 
        height={isMobile ? "60" : "70"}
        preserveAspectRatio="xMidYMid meet"
      />
      {isMobile && selectedEvent && (
        <MobileLabel>
          {selectedEvent.title}
        </MobileLabel>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 80%;
  margin: 10px auto 25px;
  position: relative;
  touch-action: pan-y; /* Allow vertical scrolling but capture horizontal */
  
  @media (max-width: 767px) {
    width: 90%;
    margin: 5px auto 30px;
  }
`;

const SVG = styled.svg`
  width: 100%;
  display: block;
`;

const MobileLabel = styled.div`
  text-align: center;
  font-size: 12px;
  margin-top: 5px;
  color: var(--text-primary);
  font-weight: 500;
  background-color: var(--background-light);
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default HorizontalTimeline; 