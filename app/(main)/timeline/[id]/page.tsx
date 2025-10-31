"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { getTimelineById as getMockTimeline } from "@/lib/data/timelineMap";
import { fetchTimelineById, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { Toaster } from "@/components/ui/toaster";

const TimelinePage = () => {
  const params = useParams();
  const timelineId = params.id as string;

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(1247);
  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        setError(null);
        
        // Try API first
        const timelineResult = await fetchTimelineById(timelineId);
        
        if (timelineResult.data) {
          setTimeline(timelineResult.data);
          
          // Fetch events
          const eventsResult = await fetchEventsByTimelineId(timelineId);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
          } else {
            setEvents([]);
          }
        } else {
          // Fallback to mock data
          const mockTimeline = getMockTimeline(timelineId);
          if (mockTimeline) {
            setTimeline(mockTimeline);
            setEvents(mockTimeline.events);
          } else {
            setError('Timeline not found');
          }
        }
      } catch (err) {
        console.error('Failed to load timeline:', err);
        // Try mock data as fallback
        const mockTimeline = getMockTimeline(timelineId);
        if (mockTimeline) {
          setTimeline(mockTimeline);
          setEvents(mockTimeline.events);
        } else {
          setError('Timeline not found');
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (timelineId) {
      loadTimeline();
    }
  }, [timelineId]);

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
      author: "TimelineEnthusiast",
      content: "Great collection! Very informative and well-structured.",
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

  if (error || !timeline) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Timeline Not Found</h2>
            <p className="text-muted-foreground">{error || "This timeline does not exist."}</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-12 max-w-6xl">
        <Timeline events={events.length > 0 ? events : timeline.events || []} pixelsPerYear={30} />

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
      <BottomMenuBar title={timeline.title} />
    </div>
  );
};

export default TimelinePage;

