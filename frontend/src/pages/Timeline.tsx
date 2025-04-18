import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import CircularTimeline from '../components/timeline/CircularTimeline';
import HorizontalTimeline from '../components/timeline/HorizontalTimeline';
import EventDetailCard from '../components/timeline/EventDetailCard';
import NavigationDots from '../components/timeline/NavigationDots';
import ShareModal from '../components/ShareModal';
import { axiosInstance } from '../api/axios';

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
  sources?: {
    title: string;
    url: string;
  }[];
}

interface Timeline {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  social_metrics: {
    likes: number;
    shares: number;
    comments: number;
  };
  events: Event[];
}

const TimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState(0); // 0: Timeline, 1: Map, 2: Gallery
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Use local width state instead of trying to get it from the store
  const [width, setWidth] = useState(window.innerWidth * 0.9);
  
  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWidth(Math.min(window.innerWidth * 0.9, 1200));
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        // For development, we'll use a mock response if needed
        let response;
        try {
          response = await axiosInstance.get(`/api/timelines/${id}`);
        } catch (error) {
          // If API isn't ready, use mock data
          console.log('Using mock data for timeline');
          response = {
            data: {
              timeline: {
                id: "timeline-123",
                title: "The History of Palestine",
                description: "A chronological overview of key events in Palestinian history.",
                start_date: "1948",
                end_date: "2025",
                author: {
                  id: "user-456",
                  name: "History Explorer",
                  avatar_url: "https://example.com/avatar.jpg"
                },
                social_metrics: {
                  likes: 1245,
                  shares: 389,
                  comments: 57
                },
                events: [
                  {
                    id: "event-001",
                    title: "Declaration of the State of Israel",
                    date: "1948-05-14",
                    description: "Jewish militias launched attacks against Palestinian villages, forcing thousands to flee. The situation escalated into a full-blown war in 1948, with the end of the British Mandate and the departure of British forces, the declaration of independence of the State of Israel and the entry of neighbouring Arab armies.",
                    importance: 5,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image1.jpg",
                        caption: "Declaration ceremony in Tel Aviv"
                      }
                    ],
                    sources: [
                      {
                        title: "Historical Archive",
                        url: "https://example.com/source1"
                      }
                    ]
                  },
                  {
                    id: "event-002",
                    title: "Six-Day War",
                    date: "1967-06-05",
                    description: "Israel launched a preemptive strike against Egypt, Syria, and Jordan, resulting in the capture of the West Bank, Gaza Strip, Sinai Peninsula, and Golan Heights.",
                    importance: 4,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image2.jpg",
                        caption: "Israeli tanks in the Sinai"
                      }
                    ]
                  },
                  {
                    id: "event-003",
                    title: "First Intifada",
                    date: "1987-12-08",
                    description: "Palestinian uprising against Israeli occupation in the Gaza Strip and West Bank.",
                    importance: 3,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image3.jpg",
                        caption: "Protests in Gaza"
                      }
                    ]
                  },
                  {
                    id: "event-004",
                    title: "Oslo Accords",
                    date: "1993-09-13",
                    description: "Peace agreement signed between Israel and the Palestine Liberation Organization.",
                    importance: 5,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image4.jpg",
                        caption: "Signing ceremony"
                      }
                    ]
                  },
                  {
                    id: "event-005",
                    title: "Second Intifada",
                    date: "2000-09-28",
                    description: "Palestinian uprising following the failure of peace negotiations.",
                    importance: 4
                  },
                  {
                    id: "event-006",
                    title: "Israel-Gaza War",
                    date: "2008-12-27",
                    description: "Israeli military operation in the Gaza Strip, codenamed Operation Cast Lead.",
                    importance: 4,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image6.jpg",
                        caption: "Gaza during the conflict"
                      }
                    ]
                  },
                  {
                    id: "event-007",
                    title: "Palestine UNESCO Membership",
                    date: "2011-10-31",
                    description: "Palestine admitted as a member state to UNESCO despite strong opposition from Israel and the United States.",
                    importance: 3
                  },
                  {
                    id: "event-008",
                    title: "UN Recognition of Palestine",
                    date: "2012-11-29",
                    description: "UN General Assembly votes to recognize Palestine as a non-member observer state.",
                    importance: 4,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image8.jpg",
                        caption: "UN General Assembly voting"
                      }
                    ]
                  },
                  {
                    id: "event-009",
                    title: "Gaza-Israel Conflict",
                    date: "2014-07-08",
                    description: "Military operation launched by Israel in the Hamas-ruled Gaza Strip, codenamed Operation Protective Edge.",
                    importance: 4
                  },
                  {
                    id: "event-010",
                    title: "US Embassy Move to Jerusalem",
                    date: "2018-05-14",
                    description: "United States relocates its embassy from Tel Aviv to Jerusalem, recognizing Jerusalem as Israel's capital.",
                    importance: 5,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image10.jpg",
                        caption: "US Embassy opening ceremony"
                      }
                    ]
                  },
                  {
                    id: "event-011",
                    title: "Abraham Accords",
                    date: "2020-09-15",
                    description: "Israel establishes diplomatic relations with the United Arab Emirates and Bahrain.",
                    importance: 4
                  },
                  {
                    id: "event-012",
                    title: "Hamas-Israel War",
                    date: "2023-10-07",
                    description: "Conflict erupts following a Hamas attack on Israel, leading to a massive Israeli military response in Gaza.",
                    importance: 5,
                    media: [
                      {
                        type: "image",
                        url: "https://example.com/image12.jpg",
                        caption: "Destruction in Gaza City"
                      }
                    ]
                  }
                ]
              }
            }
          };
        }
        
        const timelineData = response.data.timeline;
        setTimeline(timelineData);
        
        // Select the first event by default
        if (timelineData.events && timelineData.events.length > 0) {
          setSelectedEvent(timelineData.events[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load timeline data');
        setLoading(false);
        console.error('Error fetching timeline:', err);
      }
    };

    fetchTimeline();
  }, [id]);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleNextEvent = () => {
    if (!selectedEvent || !timeline) return;
    
    const currentIndex = timeline.events.findIndex(e => e.id === selectedEvent.id);
    if (currentIndex !== -1 && currentIndex < timeline.events.length - 1) {
      setSelectedEvent(timeline.events[currentIndex + 1]);
    }
  };
  
  const handlePrevEvent = () => {
    if (!selectedEvent || !timeline) return;
    
    const currentIndex = timeline.events.findIndex(e => e.id === selectedEvent.id);
    if (currentIndex > 0) {
      setSelectedEvent(timeline.events[currentIndex - 1]);
    }
  };

  const handleViewChange = (viewIndex: number) => {
    setActiveView(viewIndex);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };

  const handleIncrementShares = () => {
    if (timeline) {
      setTimeline({
        ...timeline,
        social_metrics: {
          ...timeline.social_metrics,
          shares: timeline.social_metrics.shares + 1
        }
      });
      
      // In a real app, you would also make an API call to update the share count
      try {
        // axiosInstance.post(`/api/timelines/${id}/share`);
        console.log('Incrementing share count');
      } catch (error) {
        console.error('Error updating share count:', error);
      }
    }
  };

  if (loading) {
    return <LoadingContainer>Loading timeline...</LoadingContainer>;
  }

  if (error || !timeline) {
    return <ErrorContainer>{error || 'Timeline not found'}</ErrorContainer>;
  }

  return (
    <Container>
      <HeaderSection>
        <BackButton onClick={handleGoBack}>← Back</BackButton>
        <Title>{timeline.title}</Title>
        <ShareButton onClick={handleShare}>Share</ShareButton>
      </HeaderSection>
      
      <TimelineInfo>
        <Description>{timeline.description}</Description>
        <DateRange>{timeline.start_date} - {timeline.end_date}</DateRange>
        <AuthorAndMetrics>
          <Author>By {timeline.author.name}</Author>
          <SocialMetrics>
            <Metric>❤️ {timeline.social_metrics.likes}</Metric>
            <Metric>🔄 {timeline.social_metrics.shares}</Metric>
            <Metric>💬 {timeline.social_metrics.comments}</Metric>
          </SocialMetrics>
        </AuthorAndMetrics>
      </TimelineInfo>
      
      {activeView === 0 && (
        <TimelineViewContainer>
          <CircularTimeline 
            timeline={timeline} 
            selectedEvent={selectedEvent} 
            onEventSelect={handleEventSelect} 
          />
          
          <HorizontalTimeline 
            width={width} 
            height={100}
          />
          
          {selectedEvent && (
            <EventDetailCard 
              event={selectedEvent} 
              onNextEvent={handleNextEvent}
              onPrevEvent={handlePrevEvent}
            />
          )}
        </TimelineViewContainer>
      )}
      
      {activeView === 1 && (
        <MapViewContainer>
          <p>Map view coming soon</p>
        </MapViewContainer>
      )}
      
      {activeView === 2 && (
        <GalleryViewContainer>
          <p>Gallery view coming soon</p>
        </GalleryViewContainer>
      )}
      
      <NavigationDots 
        activeIndex={activeView} 
        count={3} 
        onDotClick={handleViewChange} 
      />
      
      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={handleCloseShareModal}
        onShare={handleIncrementShares}
        title={timeline.title}
        timelineId={timeline.id}
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: var(--background-white);
  
  @media (max-width: 767px) {
    padding: 10px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  border-bottom: 1px solid var(--divider-color);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-primary);
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 0;
  color: var(--text-primary);
`;

const ShareButton = styled.button`
  background: none;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-primary);
  
  &:hover {
    background-color: var(--divider-color);
  }
`;

const TimelineInfo = styled.div`
  margin: 20px 0;
  padding: 0 20px;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 10px;
  color: var(--text-primary);
`;

const DateRange = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 5px;
`;

const AuthorAndMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const Author = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const SocialMetrics = styled.div`
  display: flex;
  gap: 15px;
`;

const Metric = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const TimelineViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
`;

const MapViewContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  background-color: var(--background-light);
  border-radius: 8px;
  margin-top: 40px;
`;

const GalleryViewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: var(--text-secondary);
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: var(--error-color);
`;

export default TimelinePage; 