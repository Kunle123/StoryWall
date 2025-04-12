import React from 'react';
import styled from 'styled-components';

interface Media {
  type: string;
  url: string;
  caption: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  importance: number;
  media?: Media[];
}

interface EventDetailCardProps {
  event: Event;
}

const EventDetailCard: React.FC<EventDetailCardProps> = ({ event }) => {
  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      // Ensure valid date format
      if (!dateString) return 'Unknown date';
      
      // Try to parse different date formats
      let dateObj;
      if (/^\d{4}$/.test(dateString)) {
        // Handle year-only format
        dateObj = new Date(parseInt(dateString, 10), 0, 1);
      } else if (/^\d{4}-\d{2}$/.test(dateString)) {
        // Handle year-month format
        const [year, month] = dateString.split('-').map(Number);
        dateObj = new Date(year, month - 1, 1);
      } else {
        // Handle full date format
        dateObj = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return dateString; // Return original if invalid
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <Container>
      <Title>{event.title}</Title>
      <DateDisplay>{formatDate(event.date)}</DateDisplay>
      <Description>{event.description}</Description>
      
      {event.media && event.media.length > 0 && (
        <MediaSection>
          {event.media.map((item: Media, index: number) => (
            <MediaItem key={index}>
              {item.type === 'image' && (
                <MediaImage src={item.url} alt={item.caption} />
              )}
              <MediaCaption>{item.caption}</MediaCaption>
            </MediaItem>
          ))}
        </MediaSection>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 85%;
  background-color: var(--card-background);
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  padding: 15px;
  margin: 20px auto 40px;
  box-shadow: var(--card-shadow);
  
  @media (min-width: 768px) {
    padding: 20px;
    width: 85%;
  }
  
  @media (max-width: 767px) {
    width: 95%;
  }
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: var(--text-primary);
`;

const DateDisplay = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
  color: var(--text-secondary);
`;

const Description = styled.div`
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-line;
  
  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const MediaSection = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--divider-color);
`;

const MediaItem = styled.div`
  margin-bottom: 10px;
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin-bottom: 5px;
  display: block;
`;

const MediaCaption = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
`;

export default EventDetailCard; 