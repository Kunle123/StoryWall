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
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({ x: 0, y: 0, title: '', date: '' });
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const isMobileView = window.innerWidth < 768;
        setIsMobile(isMobileView);
        
        // Use responsive dimensions based on screen size
        const containerHeight = isMobileView 
          ? Math.min(containerWidth * 0.9, 400) // More compact for mobile
          : containerWidth * 0.6;
          
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
    const margin = isMobile ? 20 : 40;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate radius based on container size
    const outerRadius = Math.min(width, height * 2) / 2 - margin;
    const arcThickness = isMobile ? 15 : 20;
    const innerRadius = outerRadius - arcThickness;
    
    // Calculate timespan of the timeline
    const startDate = new Date(timeline.start_date);
    const endDate = new Date(timeline.end_date);
    const timeSpan = endDate.getTime() - startDate.getTime();
    
    // Create a time scale
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timeScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, 2 * Math.PI * (300 / 360)]);
    
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
    
    // Create a group for events
    const eventsGroup = svg.append("g")
      .attr("class", "events-group")
      .attr("transform", `translate(${centerX}, ${centerY})`);
    
    // Calculate positions for each event marker
    const sortedEvents = [...timeline.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    timeline.events.forEach((event: Event) => {
      const eventDate = new Date(event.date);
      
      // Skip events outside the timeline range
      if (eventDate < startDate || eventDate > endDate) return;
      
      // Calculate the angle for this event (from -150 to +150 degrees)
      const timeRatio = (eventDate.getTime() - startDate.getTime()) / timeSpan;
      let angleInDegrees = -150 + (timeRatio * 300);
      
      // If this is the first event in chronological order, adjust position
      if (sortedEvents.length > 0 && sortedEvents[0].id === event.id) {
        angleInDegrees = -150; // Position at start of arc
      } else if (sortedEvents.length > 0 && sortedEvents[sortedEvents.length - 1].id === event.id) {
        angleInDegrees = 150; // Position at end of arc
      }
      
      const angleInRadians = angleInDegrees * (Math.PI / 180);
      
      // Calculate position on the arc
      const markerRadius = (innerRadius + outerRadius) / 2;
      const x = markerRadius * Math.cos(angleInRadians);
      const y = markerRadius * Math.sin(angleInRadians);
      
      // Draw event marker
      const isSelected = selectedEvent && selectedEvent.id === event.id;
      const markerSize = isSelected ? (isMobile ? 6 : 8) : (isMobile ? 4 : 6);
      const markerColor = isSelected ? "#FF5555" : "#FF9999";
      
      const eventMarker = eventsGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", markerSize)
        .attr("fill", markerColor)
        .attr("class", "event-marker")
        .attr("data-event-id", event.id)
        .style("cursor", "pointer");
      
      // IMPROVED EVENT HANDLING - Create a larger transparent hit area
      eventsGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", markerSize + 10) // Larger than the visible marker
        .attr("fill", "transparent")
        .attr("stroke", "transparent")
        .attr("class", "event-marker-hitarea")
        .attr("data-event-id", event.id)
        .style("cursor", "pointer");
      
      // Add improved click handler with event capturing
      const markerNode = eventMarker.node();
      if (markerNode) {
        markerNode.addEventListener('click', (e) => {
          console.log('CircularTimeline - EVENT CLICKED:', event.id, event.title);
          e.stopPropagation();
          e.preventDefault();
          onEventSelect(event);
        });
        
        // Add touch support for mobile
        markerNode.addEventListener('touchend', (e) => {
          console.log('CircularTimeline - EVENT TOUCHED:', event.id, event.title);
          e.stopPropagation();
          e.preventDefault();
          onEventSelect(event);
        });
      }
      
      // Add touch and mouse events for visual feedback
      const handleInteractionStart = function(this: SVGCircleElement) {
        d3.select(this).attr("r", markerSize + 2);
        
        // Show tooltip for mobile
        if (isMobile) {
          setTooltipData({
            x: centerX + x,
            y: centerY + y,
            title: event.title,
            date: event.date
          });
          setShowTooltip(true);
        }
      };
      
      const handleInteractionEnd = function(this: SVGCircleElement) {
        d3.select(this).attr("r", markerSize);
        
        // Hide tooltip
        if (isMobile) {
          setShowTooltip(false);
        }
      };
      
      // Add mouse events
      eventMarker
        .on("mouseover", handleInteractionStart)
        .on("mouseout", handleInteractionEnd);
      
      // Add touch events for mobile
      eventMarker
        .on("touchstart", handleInteractionStart)
        .on("touchend", handleInteractionEnd);
    });
    
    // Font size adjustments for mobile
    const yearLabelSize = isMobile ? "12px" : "16px";
    const titleSize = isMobile ? "14px" : "18px";
    
    // Add start year label (left side)
    svg.append("text")
      .attr("x", centerX - outerRadius - (isMobile ? 5 : 10))
      .attr("y", centerY)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("font-size", yearLabelSize)
      .attr("font-weight", "bold")
      .text(timeline.start_date);
    
    // Add end year label (right side)
    svg.append("text")
      .attr("x", centerX + outerRadius + (isMobile ? 5 : 10))
      .attr("y", centerY)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .attr("font-size", yearLabelSize)
      .text(timeline.end_date);
    
    // Add title in the center
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", titleSize)
      .attr("font-weight", "500")
      .text(timeline.title);
    
    // Add a semi-transparent radial gradient for better visibility on small screens
    if (isMobile) {
      const defs = svg.append("defs");
      
      const gradient = defs.append("radialGradient")
        .attr("id", "center-gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
        
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0.9);
        
      gradient.append("stop")
        .attr("offset", "70%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);
        
      // Add a center circle with the gradient for better text visibility
      svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", innerRadius * 0.7)
        .attr("fill", "url(#center-gradient)");
    }
    
  }, [timeline, dimensions, selectedEvent, onEventSelect, isMobile]);
  
  return (
    <Container ref={containerRef}>
      <SVG 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Mobile event tooltip */}
      {showTooltip && (
        <Tooltip 
          style={{ 
            left: `${tooltipData.x}px`, 
            top: `${tooltipData.y - 40}px` 
          }}
        >
          <TooltipTitle>{tooltipData.title}</TooltipTitle>
          <TooltipDate>{new Date(tooltipData.date).toLocaleDateString()}</TooltipDate>
        </Tooltip>
      )}
      
      {/* Mobile instruction hint */}
      {isMobile && (
        <MobileHint>
          Tap on dots to view events
        </MobileHint>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  touch-action: manipulation; /* Improved touch handling */
  
  @media (max-width: 767px) {
    max-width: 100%;
    overflow: hidden;
  }
`;

const SVG = styled.svg`
  width: 100%;
  height: auto;
  display: block;
`;

const Tooltip = styled.div`
  position: absolute;
  background-color: var(--card-background);
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  padding: 5px 10px;
  pointer-events: none;
  box-shadow: var(--shadow-sm);
  transform: translateX(-50%);
  z-index: 5;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    margin-left: -5px;
    border-width: 5px 5px 0;
    border-style: solid;
    border-color: var(--card-background) transparent transparent transparent;
  }
`;

const TooltipTitle = styled.div`
  font-weight: bold;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  color: var(--text-primary);
`;

const TooltipDate = styled.div`
  font-size: 10px;
  color: var(--text-secondary);
`;

const MobileHint = styled.div`
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  margin: 0 auto;
  width: 80%;
  
  @media (min-width: 768px) {
    display: none;
  }
`;

export default CircularTimeline; 