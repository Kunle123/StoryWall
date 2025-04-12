import React, { useEffect, useRef } from 'react';
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
  
  useEffect(() => {
    if (!svgRef.current || !timeline.events.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements
    
    // Get container dimensions
    const container = containerRef.current;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = 50; // Fixed height for horizontal timeline
    
    // Timeline bar dimensions
    const barHeight = 12;
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
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(timeline.start_date);
    
    // Add end year label
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", barY + barHeight / 2)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "14px")
      .text(timeline.end_date);
    
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
          .attr("stroke", "#555555")
          .attr("stroke-width", 2);
      }
    }
    
    // Make timeline clickable
    svg.append("rect")
      .attr("x", 20)
      .attr("y", barY)
      .attr("width", width - 40)
      .attr("height", barHeight)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("click", function(event: MouseEvent) {
        // Get mouse position and convert to date
        const mouseX = d3.pointer(event)[0];
        const clickDate = timeScale.invert(mouseX);
        
        // Find the nearest event
        if (timeline.events.length > 0) {
          const nearestEvent = findNearestEvent(clickDate, timeline.events);
          if (nearestEvent) {
            onEventSelect(nearestEvent);
          }
        }
      });
    
  }, [timeline, selectedEvent, onEventSelect]);
  
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
  
  return (
    <Container ref={containerRef}>
      <SVG 
        ref={svgRef} 
        width="100%" 
        height="50"
        preserveAspectRatio="xMidYMid meet"
      />
    </Container>
  );
};

const Container = styled.div`
  width: 80%;
  margin: 20px auto;
  position: relative;
  
  @media (max-width: 767px) {
    width: 90%;
  }
`;

const SVG = styled.svg`
  width: 100%;
  height: 50px;
  display: block;
`;

export default HorizontalTimeline; 