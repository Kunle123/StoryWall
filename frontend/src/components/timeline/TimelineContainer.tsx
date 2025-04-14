import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import CircularDialTimeline from './CircularDialTimeline';
import HorizontalTimeline from './HorizontalTimeline';
import EventDetail from './EventDetail';
import { TimelineContainerProps } from './types';
import { useTimelineStore, TimelineEvent as StoreTimelineEvent } from '../../stores/timelineStore';

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const TimelineSection = styled.section`
  margin-bottom: 40px;
`;

const TimelineTitle = styled.h1`
  text-align: center;
  color: var(--heading-color, #333333);
  margin-bottom: 30px;
  font-size: 2rem;
`;

const TimelineDescription = styled.p`
  text-align: center;
  color: var(--text-color, #555555);
  max-width: 800px;
  margin: 0 auto 40px;
  line-height: 1.6;
`;

/**
 * Main container component that coordinates the circular and horizontal timelines
 * Using Zustand for state management
 */
const TimelineContainer: React.FC<TimelineContainerProps> = ({
  timelineData,
  width = window.innerWidth * 0.9,
  height = 500,
  initialEventId
}) => {
  // Reference to container for responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reference to track whether we've initialized the store
  const storeInitializedRef = useRef(false);
  
  // Get state and actions from the store
  const {
    events,
    selectedEventId,
    zoomedTimespan,
    selectEvent,
    calculateZoomedTimespan,
    getSelectedEvent
  } = useTimelineStore();
  
  // Calculate responsive dimensions
  const [dimensions, setDimensions] = React.useState({
    width: width > 1200 ? 1200 : width,
    circleHeight: Math.min(500, width * 0.8),
    horizontalHeight: 100
  });
  
  // Initialize store with timeline data - only run once
  useEffect(() => {
    if (timelineData?.events && !storeInitializedRef.current) {
      // Set the flag to prevent future initializations
      storeInitializedRef.current = true;
      
      console.log("Initializing timeline store with", timelineData.events.length, "events");
      
      // Convert events to the format expected by the store
      const convertedEvents: StoreTimelineEvent[] = timelineData.events.map(event => ({
        ...event,
        date: typeof event.date === 'string' ? event.date : event.date.toISOString(),
        importance: event.importance || 3, // Default importance if missing
      }));
      
      // Load events into store
      useTimelineStore.setState({ events: convertedEvents });
      
      // Select initial event if provided, otherwise select first event
      if (initialEventId) {
        setTimeout(() => selectEvent(initialEventId), 0);
      } else if (timelineData.events.length > 0) {
        setTimeout(() => selectEvent(timelineData.events[0].id), 0);
      }
    }
  }, [timelineData, initialEventId, selectEvent]); // Don't include selectedEventId here
  
  // Calculate zoomed timespan when needed - but don't do it during initialization
  useEffect(() => {
    if (storeInitializedRef.current && selectedEventId && !zoomedTimespan) {
      console.log("Calculating zoomed timespan for event", selectedEventId);
      calculateZoomedTimespan();
    }
  }, [selectedEventId, zoomedTimespan, calculateZoomedTimespan]);
  
  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setDimensions({
          width: containerWidth,
          circleHeight: Math.min(500, containerWidth * 0.8),
          horizontalHeight: 100
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get selected event
  const selectedEvent = getSelectedEvent();
  
  // If no events, show placeholder
  if (!events || events.length === 0) {
    return (
      <Container ref={containerRef}>
        <TimelineTitle>No events to display</TimelineTitle>
        <TimelineDescription>
          This timeline doesn't have any events yet.
        </TimelineDescription>
      </Container>
    );
  }
  
  return (
    <Container ref={containerRef}>
      {timelineData.title && (
        <TimelineTitle>{timelineData.title}</TimelineTitle>
      )}
      
      {timelineData.description && (
        <TimelineDescription>{timelineData.description}</TimelineDescription>
      )}
      
      <TimelineSection>
        <CircularDialTimeline
          width={dimensions.width}
          height={dimensions.circleHeight}
        />
      </TimelineSection>
      
      {zoomedTimespan && (
        <TimelineSection>
          <HorizontalTimeline
            width={dimensions.width}
            height={dimensions.horizontalHeight}
          />
        </TimelineSection>
      )}
      
      {selectedEvent && (
        <TimelineSection>
          <EventDetail />
        </TimelineSection>
      )}
    </Container>
  );
};

export default TimelineContainer; 