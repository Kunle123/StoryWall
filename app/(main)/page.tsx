"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { carTimelineEvents } from "@/lib/data/timelineData";
import { fetchTimelines, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(1247);
  const [events, setEvents] = useState<TimelineEvent[]>(carTimelineEvents);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("Interactive Timeline");
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");

  const formatDateRange = (events: TimelineEvent[]) => {
    if (events.length === 0) return "";
    const sorted = [...events].sort((a, b) => a.year - b.year);
    const startYear = sorted[0].year;
    const endYear = sorted[sorted.length - 1].year;
    return `${startYear} - ${endYear}`;
  };
  
  useEffect(() => {
    // Try to fetch the first public timeline from API
    async function loadTimeline() {
      try {
        setLoading(true);
        const timelinesResult = await fetchTimelines({ limit: 1, is_public: true });
        
        if (timelinesResult.data && timelinesResult.data.length > 0) {
          const timeline = timelinesResult.data[0];
          setTimelineTitle(timeline.title || "Interactive Timeline");
          
          // Fetch events for this timeline
          const eventsResult = await fetchEventsByTimelineId(timeline.id);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to mock data
        setEvents(carTimelineEvents);
        setTimelineTitle("Interactive Timeline");
      } catch (error) {
        console.error('Failed to load timeline from API, using mock data:', error);
        setEvents(carTimelineEvents);
      } finally {
        setLoading(false);
      }
    }
    
    loadTimeline();
  }, []);
  
  const mockComments = [
    {
      id: "1",
      author: "HistoryFan",
      content: "This is an amazing timeline! Love how you've organized everything.",
      timestamp: "1 hour ago",
      likes: 23,
    },
    {
      id: "2",
      author: "CarEnthusiast",
      content: "Great collection of automotive milestones. Very informative!",
      timestamp: "3 hours ago",
      likes: 15,
    },
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-14">
        <Header />
        <main className="container mx-auto px-4 pt-12 max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading timeline...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-12 max-w-6xl">
        <Timeline events={events} pixelsPerYear={30} viewMode={viewMode} onViewModeChange={setViewMode} />
        
        {/* Timeline Social Interactions */}
        <Card className="p-6 mt-8 bg-card border-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                // @ts-ignore - Type inference issue with class-variance-authority
                variant={isLiked ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  setIsLiked(!isLiked);
                  setLikes(isLiked ? likes - 1 : likes + 1);
                }}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {likes} Likes
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {mockComments.length} Comments
              </Button>
            </div>
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant={isFollowing ? "secondary" : "default"}
              className="gap-2"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <UserPlus className="w-4 h-4" />
              {isFollowing ? "Following Creator" : "Follow Creator"}
            </Button>
          </div>
          
          <CommentsSection comments={mockComments} />
        </Card>
      </main>
      <BottomMenuBar 
        title={timelineTitle} 
        dateRange={formatDateRange(events)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default Index;
