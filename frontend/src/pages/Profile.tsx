import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { axiosInstance } from '../api/axios';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface UserTimeline {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  createdAt: string;
  social_metrics: {
    likes: number;
    shares: number;
    comments: number;
  };
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userTimelines, setUserTimelines] = useState<UserTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timelines'); // 'timelines' or 'settings'

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // For development, use mock data if API isn't ready
        let profileResponse, timelinesResponse;
        
        try {
          profileResponse = await axiosInstance.get('/api/users/me');
          timelinesResponse = await axiosInstance.get('/api/timelines/user');
        } catch (error) {
          console.log('API not available, using mock profile data');
          
          // Mock profile data
          profileResponse = {
            data: {
              user: {
                id: 'user-123',
                name: 'Test User',
                username: 'testuser',
                email: 'user@example.com',
                bio: 'I love creating historical timelines!',
                avatarUrl: 'https://via.placeholder.com/150',
                createdAt: '2023-01-15T00:00:00.000Z'
              }
            }
          };
          
          // Mock timelines data
          timelinesResponse = {
            data: {
              timelines: [
                {
                  id: 'timeline-123',
                  title: 'The History of Palestine',
                  description: 'A chronological overview of key events in Palestinian history.',
                  start_date: '1948',
                  end_date: '2025',
                  createdAt: '2023-03-10T00:00:00.000Z',
                  social_metrics: {
                    likes: 1245,
                    shares: 389,
                    comments: 57
                  }
                },
                {
                  id: 'timeline-124',
                  title: 'Evolution of Smartphones',
                  description: 'The development of mobile phone technology from early devices to modern smartphones.',
                  start_date: '1973',
                  end_date: '2023',
                  createdAt: '2023-04-05T00:00:00.000Z',
                  social_metrics: {
                    likes: 987,
                    shares: 245,
                    comments: 32
                  }
                }
              ]
            }
          };
        }
        
        setProfile(profileResponse.data.user);
        setUserTimelines(timelinesResponse.data.timelines);
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
        console.error('Error fetching profile:', err);
      }
    };
    
    fetchProfileData();
  }, []);

  if (loading) {
    return <LoadingContainer>Loading profile...</LoadingContainer>;
  }

  if (error || !profile) {
    return <ErrorContainer>{error || 'Profile not found'}</ErrorContainer>;
  }

  return (
    <Container>
      <ProfileHeader>
        <AvatarContainer>
          <Avatar src={profile.avatarUrl || 'https://via.placeholder.com/150'} alt={profile.name} />
        </AvatarContainer>
        <ProfileInfo>
          <Name>{profile.name}</Name>
          <Username>@{profile.username}</Username>
          <Bio>{profile.bio || 'No bio yet'}</Bio>
          <JoinDate>Joined {new Date(profile.createdAt).toLocaleDateString()}</JoinDate>
        </ProfileInfo>
      </ProfileHeader>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'timelines'} 
          onClick={() => setActiveTab('timelines')}
        >
          My Timelines
        </Tab>
        <Tab 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Profile Settings
        </Tab>
      </TabsContainer>
      
      {activeTab === 'timelines' && (
        <Section>
          <SectionHeader>
            <SectionTitle>My Timelines</SectionTitle>
            <CreateButton to="/create-timeline">Create New Timeline</CreateButton>
          </SectionHeader>
          
          {userTimelines.length > 0 ? (
            <TimelinesList>
              {userTimelines.map(timeline => (
                <TimelineCard key={timeline.id}>
                  <TimelineTitle>{timeline.title}</TimelineTitle>
                  <TimelineDescription>{timeline.description}</TimelineDescription>
                  <TimelineDates>{timeline.start_date} - {timeline.end_date}</TimelineDates>
                  <TimelineFooter>
                    <TimelineMetrics>
                      <Metric>❤️ {timeline.social_metrics.likes}</Metric>
                      <Metric>🔄 {timeline.social_metrics.shares}</Metric>
                      <Metric>💬 {timeline.social_metrics.comments}</Metric>
                    </TimelineMetrics>
                    <TimelineActions>
                      <ViewLink to={`/timeline/${timeline.id}`}>View</ViewLink>
                      <EditLink to={`/edit-timeline/${timeline.id}`}>Edit</EditLink>
                    </TimelineActions>
                  </TimelineFooter>
                </TimelineCard>
              ))}
            </TimelinesList>
          ) : (
            <EmptyState>
              <p>You haven't created any timelines yet.</p>
              <CreateButton to="/create-timeline">Create Your First Timeline</CreateButton>
            </EmptyState>
          )}
        </Section>
      )}
      
      {activeTab === 'settings' && (
        <Section>
          <SectionTitle>Profile Settings</SectionTitle>
          <SettingsForm>
            <SettingsGroup>
              <SettingsLabel>Name</SettingsLabel>
              <SettingsInput type="text" defaultValue={profile.name} disabled />
            </SettingsGroup>
            
            <SettingsGroup>
              <SettingsLabel>Username</SettingsLabel>
              <SettingsInput type="text" defaultValue={profile.username} disabled />
            </SettingsGroup>
            
            <SettingsGroup>
              <SettingsLabel>Email</SettingsLabel>
              <SettingsInput type="email" defaultValue={profile.email} disabled />
            </SettingsGroup>
            
            <SettingsGroup>
              <SettingsLabel>Bio</SettingsLabel>
              <SettingsTextarea defaultValue={profile.bio || ''} disabled />
            </SettingsGroup>
            
            <SettingsNote>
              Profile editing is currently disabled in this demo version.
            </SettingsNote>
          </SettingsForm>
        </Section>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 767px) {
    padding: 10px;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const AvatarContainer = styled.div`
  margin-right: 30px;
  
  @media (max-width: 767px) {
    margin-right: 0;
    margin-bottom: 20px;
  }
`;

const Avatar = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Name = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #333333;
`;

const Username = styled.div`
  font-size: 16px;
  color: #666666;
  margin-bottom: 10px;
`;

const Bio = styled.p`
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 10px;
  color: #333333;
`;

const JoinDate = styled.div`
  font-size: 14px;
  color: #999999;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #CCCCCC;
  margin-bottom: 20px;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 15px 20px;
  font-size: 16px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#333333' : '#666666'};
  border-bottom: ${props => props.active ? '2px solid #FF9999' : 'none'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #FF5555;
  }
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionHeader = styled.div`
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

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #333333;
`;

const CreateButton = styled(Link)`
  background-color: #FF9999;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #FF5555;
  }
`;

const TimelinesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const TimelineCard = styled.div`
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const TimelineTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333333;
`;

const TimelineDescription = styled.p`
  font-size: 14px;
  color: #666666;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  min-height: 60px;
`;

const TimelineDates = styled.div`
  font-size: 14px;
  color: #999999;
  margin-bottom: 15px;
`;

const TimelineFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const TimelineMetrics = styled.div`
  display: flex;
  gap: 10px;
`;

const Metric = styled.span`
  font-size: 14px;
  color: #666666;
`;

const TimelineActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewLink = styled(Link)`
  color: #FF9999;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    color: #FF5555;
    text-decoration: underline;
  }
`;

const EditLink = styled(Link)`
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    color: #333333;
    text-decoration: underline;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 0;
  color: #666666;
  
  p {
    margin-bottom: 20px;
    font-size: 16px;
  }
`;

const SettingsForm = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SettingsGroup = styled.div`
  margin-bottom: 20px;
`;

const SettingsLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333333;
`;

const SettingsInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.disabled ? '#F5F5F5' : 'white'};
`;

const SettingsTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  background-color: ${props => props.disabled ? '#F5F5F5' : 'white'};
`;

const SettingsNote = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #FFF8E1;
  border-radius: 4px;
  font-size: 14px;
  color: #856404;
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

export default Profile; 