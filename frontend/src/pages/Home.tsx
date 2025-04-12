import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../styles/Home.css';

interface Timeline {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  userId: string;
  startDate: string;
  endDate?: string;
  category?: string;
  tags?: string[];
  viewCount: number;
}

const Home: React.FC = () => {
  const [featuredTimelines, setFeaturedTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedTimelines = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/timelines/public');
        
        if (response.data.success) {
          setFeaturedTimelines(response.data.data);
        } else {
          setError(response.data.error?.message || 'Failed to fetch timelines');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTimelines();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Create Beautiful Interactive Timelines</h1>
          <p>
            StoryWall helps you visualize history, projects, and stories through
            engaging interactive timelines. Share your story with the world.
          </p>
          <div className="hero-cta">
            <Link to="/create-timeline" className="btn btn-primary">
              Create Your Timeline
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="/images/timeline-illustration.svg" 
            alt="Interactive Timeline Illustration" 
          />
        </div>
      </section>

      {/* Featured Timelines */}
      <section className="featured-timelines">
        <h2>Featured Timelines</h2>
        {loading ? (
          <div className="loading">Loading timelines...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="timeline-grid">
            {featuredTimelines.length > 0 ? (
              featuredTimelines.map((timeline) => (
                <div className="timeline-card" key={timeline.id}>
                  <div className="timeline-card-image">
                    <img 
                      src={timeline.coverImageUrl || '/images/timeline-placeholder.jpg'} 
                      alt={timeline.title} 
                    />
                  </div>
                  <div className="timeline-card-content">
                    <h3>{timeline.title}</h3>
                    <p>{timeline.description}</p>
                    <div className="timeline-card-tags">
                      {timeline.category && (
                        <span className="tag category-tag">{timeline.category}</span>
                      )}
                      {timeline.tags?.slice(0, 2).map((tag, index) => (
                        <span className="tag" key={index}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link 
                      to={`/timeline/${timeline.id}`} 
                      className="btn btn-small"
                    >
                      View Timeline
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-timelines">
                <p>No featured timelines available yet. Be the first to create one!</p>
                <Link to="/create-timeline" className="btn btn-primary">
                  Create Timeline
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">1</div>
            <h3>Create</h3>
            <p>Sign up and create your timeline with our easy-to-use editor.</p>
          </div>
          <div className="step">
            <div className="step-icon">2</div>
            <h3>Customize</h3>
            <p>Add events, media, and customize the appearance of your timeline.</p>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <h3>Share</h3>
            <p>Share your timeline with friends, colleagues, or the world.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 