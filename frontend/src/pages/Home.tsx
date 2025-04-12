import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { axiosInstance } from '../api/axios';
import '../styles/Home.css';

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
  thumbnail_url?: string;
  category?: string;
}

const Home: React.FC = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [filteredTimelines, setFilteredTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ min: '', max: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', 'history', 'technology', 'science', 'culture', 'politics'];

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        setLoading(true);
        
        let response;
        try {
          response = await axiosInstance.get('/api/timelines');
        } catch (error) {
          console.log('Using mock timeline data');
          response = {
            data: {
              timelines: [
                {
                  id: "timeline-123",
                  title: "The History of Palestine",
                  description: "A chronological overview of key events in Palestinian history from 1948 to present day.",
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
                  thumbnail_url: "https://via.placeholder.com/120",
                  category: "history"
                },
                {
                  id: "timeline-124",
                  title: "Evolution of Smartphones",
                  description: "The development of mobile phone technology from early devices to modern smartphones.",
                  start_date: "1973",
                  end_date: "2023",
                  author: {
                    id: "user-457",
                    name: "Tech Historian",
                    avatar_url: "https://example.com/avatar2.jpg"
                  },
                  social_metrics: {
                    likes: 987,
                    shares: 245,
                    comments: 32
                  },
                  thumbnail_url: "https://via.placeholder.com/120",
                  category: "technology"
                },
                {
                  id: "timeline-125",
                  title: "Space Exploration Milestones",
                  description: "Major achievements in human space exploration from the first satellite to Mars missions.",
                  start_date: "1957",
                  end_date: "2023",
                  author: {
                    id: "user-458",
                    name: "Space Enthusiast",
                    avatar_url: "https://example.com/avatar3.jpg"
                  },
                  social_metrics: {
                    likes: 1567,
                    shares: 478,
                    comments: 89
                  },
                  thumbnail_url: "https://via.placeholder.com/120",
                  category: "science"
                }
              ]
            }
          };
        }
        
        setTimelines(response.data.timelines);
        setFilteredTimelines(response.data.timelines);
        setLoading(false);
      } catch (err) {
        setError('Failed to load timelines');
        setLoading(false);
        console.error('Error fetching timelines:', err);
      }
    };

    fetchTimelines();
  }, []);

  useEffect(() => {
    let result = [...timelines];
    
    if (categoryFilter !== 'all') {
      result = result.filter(timeline => timeline.category === categoryFilter);
    }
    
    if (dateFilter.min) {
      result = result.filter(timeline => parseInt(timeline.start_date) >= parseInt(dateFilter.min));
    }
    
    if (dateFilter.max) {
      result = result.filter(timeline => parseInt(timeline.end_date) <= parseInt(dateFilter.max));
    }
    
    switch (sortOption) {
      case 'recent':
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popular':
        result.sort((a, b) => b.social_metrics.likes - a.social_metrics.likes);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    setFilteredTimelines(result);
  }, [timelines, categoryFilter, dateFilter, sortOption]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value);
  };

  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(event.target.value);
  };

  const handleDateFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setDateFilter({ min: '', max: '' });
  };

  const handleLike = (id: string) => {
    setTimelines((prevTimelines: Timeline[]) => 
      prevTimelines.map((timeline: Timeline) => 
        timeline.id === id 
          ? { 
              ...timeline, 
              social_metrics: { 
                ...timeline.social_metrics, 
                likes: timeline.social_metrics.likes + 1 
              } 
            } 
          : timeline
      )
    );
  };

  if (loading) {
    return <LoadingContainer>Loading timelines...</LoadingContainer>;
  }

  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  return (
    <Container>
      <Header>
        <Title>Explore Timelines</Title>
        <ControlsContainer>
          <FilterButton onClick={handleFilterToggle}>
            {filterOpen ? 'Hide Filters' : 'Show Filters'} 🔍
          </FilterButton>
          <SortContainer>
            <SortLabel>Sort by:</SortLabel>
            <SortSelect value={sortOption} onChange={handleSortChange}>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="alphabetical">Alphabetical</option>
            </SortSelect>
          </SortContainer>
        </ControlsContainer>
      </Header>
      
      {filterOpen && (
        <FilterContainer>
          <FilterGroup>
            <FilterLabel>Category:</FilterLabel>
            <FilterSelect value={categoryFilter} onChange={handleCategoryChange}>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>Date Range:</FilterLabel>
            <DateInputContainer>
              <DateInput 
                type="number" 
                placeholder="From year" 
                name="min" 
                value={dateFilter.min} 
                onChange={handleDateFilterChange} 
              />
              <DateSeparator>to</DateSeparator>
              <DateInput 
                type="number" 
                placeholder="To year" 
                name="max" 
                value={dateFilter.max} 
                onChange={handleDateFilterChange} 
              />
            </DateInputContainer>
          </FilterGroup>
          
          <ClearButton onClick={handleClearFilters}>
            Clear Filters
          </ClearButton>
        </FilterContainer>
      )}
      
      <ResultSummary>
        Showing {filteredTimelines.length} of {timelines.length} timelines
      </ResultSummary>
      
      <TimelineList>
        {filteredTimelines.map(timeline => (
          <TimelineCard key={timeline.id}>
            <CardContent>
              <CardTitle>{timeline.title}</CardTitle>
              <CardDescription>{timeline.description}</CardDescription>
              <CardDateRange>{timeline.start_date} - {timeline.end_date}</CardDateRange>
              {timeline.category && (
                <CategoryBadge>{timeline.category}</CategoryBadge>
              )}
            </CardContent>
            
            <CardThumbnail>
              <img 
                src={timeline.thumbnail_url || "https://via.placeholder.com/120"} 
                alt={`${timeline.title} thumbnail`} 
              />
            </CardThumbnail>
            
            <SocialMetricsBar>
              <SocialMetric onClick={() => handleLike(timeline.id)}>
                <SocialIcon>❤️</SocialIcon>
                <SocialCount>{timeline.social_metrics.likes}</SocialCount>
              </SocialMetric>
              <SocialMetric>
                <SocialIcon>🔄</SocialIcon>
                <SocialCount>{timeline.social_metrics.shares}</SocialCount>
              </SocialMetric>
              <SocialMetric>
                <SocialIcon>💬</SocialIcon>
                <SocialCount>{timeline.social_metrics.comments}</SocialCount>
              </SocialMetric>
              
              <ViewButton to={`/timeline/${timeline.id}`}>
                View Timeline
              </ViewButton>
            </SocialMetricsBar>
          </TimelineCard>
        ))}
      </TimelineList>
      
      {filteredTimelines.length === 0 && (
        <NoResultsMessage>
          No timelines match your filter criteria. Try adjusting your filters.
        </NoResultsMessage>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 767px) {
    padding: 10px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
`;

const FilterButton = styled.button`
  background-color: var(--background-light);
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-primary);
  
  &:hover {
    background-color: var(--divider-color);
  }
`;

const FilterContainer = styled.div`
  background-color: var(--background-light);
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: #666666;
  margin-bottom: 5px;
`;

const FilterSelect = styled.select`
  padding: 8px;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--input-background);
  color: var(--text-primary);
`;

const DateInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DateInput = styled.input`
  padding: 8px;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  font-size: 14px;
  width: 100px;
  background-color: var(--input-background);
  color: var(--text-primary);
`;

const DateSeparator = styled.span`
  color: #666666;
`;

const ClearButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:hover {
    background-color: var(--background-light);
  }
`;

const ResultSummary = styled.div`
  font-size: 14px;
  color: #666666;
  margin-bottom: 15px;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: var(--text-secondary);
  background-color: var(--background-light);
  border-radius: 8px;
  margin-top: 20px;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  background-color: var(--secondary-light);
  color: var(--secondary-dark);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-top: 8px;
  text-transform: capitalize;
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
`;

const SortLabel = styled.span`
  margin-right: 10px;
  font-size: 14px;
  color: #666666;
`;

const SortSelect = styled.select`
  padding: 8px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
`;

const TimelineList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TimelineCard = styled.div`
  background-color: var(--card-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-left 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-left: 2px solid var(--primary-color);
  }
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: var(--text-primary);
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
`;

const CardDateRange = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const CardThumbnail = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--divider-color);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 767px) {
    width: 80px;
    height: 80px;
    top: 15px;
    right: 15px;
  }
`;

const SocialMetricsBar = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid var(--divider-color);
  background-color: var(--background-light);
  height: 40px;
  position: relative;
`;

const SocialMetric = styled.div`
  display: flex;
  align-items: center;
  margin-right: 20px;
  cursor: pointer;
  color: var(--text-secondary);
`;

const SocialIcon = styled.span`
  font-size: 16px;
  margin-right: 5px;
`;

const SocialCount = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
`;

const ViewButton = styled(Link)`
  position: absolute;
  right: 20px;
  background-color: var(--primary-color);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: var(--primary-dark);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #666666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #FF5555;
`;

export default Home; 