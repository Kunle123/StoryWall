import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTimelineStore } from '../../stores/timelineStore';

// Styled components
const DetailContainer = styled(motion.div)`
  margin-top: 30px;
  padding: 20px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  background-color: var(--card-bg, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EventTitle = styled.h2`
  margin-top: 0;
  color: var(--heading-color, #333333);
  font-size: 1.5rem;
`;

const EventDate = styled.div`
  color: var(--secondary-text, #666666);
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

const EventDescription = styled.p`
  line-height: 1.6;
  color: var(--text-color, #333333);
  margin-bottom: 20px;
`;

const MediaContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const EventImage = styled.img`
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const VideoContainer = styled.div`
  width: 100%;
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 4px;
`;

const EventVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
`;

/**
 * Event detail component that displays information about the selected event
 * Uses Zustand for state management
 */
const EventDetail: React.FC = () => {
  // Get selected event from store
  const { getSelectedEvent } = useTimelineStore();
  const event = getSelectedEvent();
  
  // Return null if no event is selected
  if (!event) {
    return null;
  }
  
  // Format the date in a user-friendly way
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Determine whether to use event.media or direct imageUrl/videoUrl
  const hasMedia = event.media && Array.isArray(event.media) && event.media.length > 0;
  const primaryImage = hasMedia && event.media 
    ? event.media.find(m => m.type === 'image')?.url 
    : event.imageUrl;
  
  const primaryVideo = hasMedia && event.media
    ? event.media.find(m => m.type === 'video')?.url
    : event.videoUrl;
  
  return (
    <DetailContainer
      key={event.id} // Key helps React recognize this is a new event
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <EventTitle data-event-id={event.id}>{event.title}</EventTitle>
      <EventDate>{formattedDate}</EventDate>
      
      <EventDescription>{event.description}</EventDescription>
      
      {event.location && (
        <EventDescription>
          <strong>Location:</strong> {event.location}
        </EventDescription>
      )}
      
      {event.category && (
        <EventDescription>
          <strong>Category:</strong> {event.category}
        </EventDescription>
      )}
      
      {primaryImage && (
        <MediaContainer>
          <EventImage 
            src={primaryImage} 
            alt={`Image for ${event.title}`} 
            loading="lazy"
          />
        </MediaContainer>
      )}
      
      {primaryVideo && (
        <MediaContainer>
          <VideoContainer>
            <EventVideo
              controls
              src={primaryVideo}
              aria-label={`Video for ${event.title}`}
            />
          </VideoContainer>
        </MediaContainer>
      )}
      
      {event.sources && event.sources.length > 0 && (
        <EventDescription>
          <strong>Sources:</strong>
          <ul>
            {event.sources.map((source, index) => (
              <li key={index}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </EventDescription>
      )}
    </DetailContainer>
  );
};

export default EventDetail; 