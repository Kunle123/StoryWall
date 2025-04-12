import React, { useRef, useEffect, useState } from 'react';
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
  onNextEvent?: () => void;
  onPrevEvent?: () => void;
}

const EventDetailCard: React.FC<EventDetailCardProps> = ({ 
  event,
  onNextEvent,
  onPrevEvent
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Set mobile state on render and window resize
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

  // Handle swipe gestures
  useEffect(() => {
    // Required minimum distance traveled to be considered swipe
    const minSwipeDistance = 50;
    
    if (touchStart && touchEnd && (onNextEvent || onPrevEvent)) {
      // Calculate distance traveled
      const distance = touchStart - touchEnd;
      const isSwipe = Math.abs(distance) > minSwipeDistance;
      
      if (isSwipe) {
        // Determine direction and navigate
        if (distance > 0 && onNextEvent) {
          // Swiped left (next)
          onNextEvent();
        } else if (distance < 0 && onPrevEvent) {
          // Swiped right (previous)
          onPrevEvent();
        }
      }
    }
  }, [touchEnd, touchStart, onNextEvent, onPrevEvent]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    setTouchStart(null);
    setTouchEnd(null);
  };

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
    <Container 
      ref={cardRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
      
      {isMobile && (onPrevEvent || onNextEvent) && (
        <NavigationHint>
          ← Swipe to navigate →
        </NavigationHint>
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
  transition: all 0.3s ease;
  
  @media (min-width: 768px) {
    padding: 20px;
    width: 85%;
    
    &:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 767px) {
    width: 95%;
    padding: 15px 12px;
    margin: 10px auto 30px;
  }
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: var(--text-primary);
  
  @media (max-width: 767px) {
    font-size: 16px;
  }
`;

const DateDisplay = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
  color: var(--text-secondary);
  
  @media (max-width: 767px) {
    font-size: 12px;
    margin-bottom: 10px;
  }
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
  
  @media (max-width: 767px) {
    margin-top: 12px;
    padding-top: 12px;
  }
`;

const MediaItem = styled.div`
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin-bottom: 5px;
  display: block;
  
  @media (max-width: 767px) {
    max-height: 200px;
  }
`;

const MediaCaption = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  
  @media (max-width: 767px) {
    font-size: 11px;
  }
`;

const NavigationHint = styled.div`
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed var(--divider-color);
  font-style: italic;
  opacity: 0.7;
`;

export default EventDetailCard; 