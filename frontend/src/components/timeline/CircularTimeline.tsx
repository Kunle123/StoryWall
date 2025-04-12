import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  importance: number;
  media?: {
    type: string;
    url: string;
    caption: string;
  }[];
}

interface Timeline {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  events: Event[];
}

interface CircularTimelineProps {
  timeline: Timeline;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

const CircularTimeline: React.FC<CircularTimelineProps> = ({ 
  timeline, 
  selectedEvent, 
  onEventSelect 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Use responsive dimensions based on screen size
        const containerHeight = window.innerWidth < 768 ? containerWidth * 0.8 : containerWidth * 0.6;
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Build the timeline visualization
  useEffect(() => {
    if (!svgRef.current || !timeline.events.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements
    
    const { width, height } = dimensions;
    const margin = 40;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate radius based on container size
    const outerRadius = Math.min(width, height * 2) / 2 - margin;
    const arcThickness = 20;
    const innerRadius = outerRadius - arcThickness;
    
    // Calculate timespan of the timeline
    const startDate = new Date(timeline.start_date);
    const endDate = new Date(timeline.end_date);
    const timeSpan = endDate.getTime() - startDate.getTime();
    
    // Create a time scale
    const timeScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, 300 * (Math.PI / 180)]); // 300 degrees in radians
    
    // Create the 300-degree arc (spanning from -150 to +150 degrees)
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(-150 * (Math.PI / 180))
      .endAngle(150 * (Math.PI / 180));
    
    // Draw the base arc
    svg.append("path")
      .attr("d", arc as any)
      .attr("fill", "#D0D0D0")
      .attr("transform", `translate(${centerX}, ${centerY})`);
    
    // Calculate positions for each event marker
    timeline.events.forEach((event: Event) => {
      const eventDate = new Date(event.date);
      
      // Skip events outside the timeline range
      if (eventDate < startDate || eventDate > endDate) return;
      
      // Calculate the angle for this event (from -150 to +150 degrees)
      const timeRatio = (eventDate.getTime() - startDate.getTime()) / timeSpan;
      const angleInDegrees = -150 + (timeRatio * 300);
      const angleInRadians = angleInDegrees * (Math.PI / 180);
      
      // Calculate position on the arc
      const markerRadius = (innerRadius + outerRadius) / 2;
      const x = centerX + markerRadius * Math.cos(angleInRadians);
      const y = centerY + markerRadius * Math.sin(angleInRadians);
      
      // Draw event marker
      const isSelected = selectedEvent && selectedEvent.id === event.id;
      const markerSize = isSelected ? 8 : 6;
      const markerColor = isSelected ? "#FF5555" : "#FF9999";
      
      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", markerSize)
        .attr("fill", markerColor)
        .attr("class", "event-marker")
        .attr("data-event-id", event.id)
        .style("cursor", "pointer")
        .on("click", () => onEventSelect(event))
        .on("mouseover", function(this: SVGCircleElement) {
          d3.select(this).attr("r", markerSize + 2);
        })
        .on("mouseout", function(this: SVGCircleElement) {
          d3.select(this).attr("r", markerSize);
        });
    });
    
    // Add start year label (left side)
    svg.append("text")
      .attr("x", centerX - outerRadius - 10)
      .attr("y", centerY)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(timeline.start_date);
    
    // Add end year label (right side)
    svg.append("text")
      .attr("x", centerX + outerRadius + 10)
      .attr("y", centerY)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "16px")
      .text(timeline.end_date);
    
    // Add title in the center
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "500")
      .text(timeline.title);
    
  }, [timeline, dimensions, selectedEvent, onEventSelect]);
  
  return (
    <Container ref={containerRef}>
      <SVG 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
`;

const SVG = styled.svg`
  width: 100%;
  height: auto;
  display: block;
`;

export default CircularTimeline; 