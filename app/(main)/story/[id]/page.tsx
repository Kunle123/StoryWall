"use client";

import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Tag, ArrowLeft, Heart, Share2, UserPlus } from "lucide-react";
import { carTimelineEvents, ukWarsTimeline } from "@/lib/data/timelineData";
import { getAllEvents } from "@/lib/data/mockTimelines";
import { fetchEventById } from "@/lib/api/client";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { useState, useEffect } from "react";

const Story = () => {
  const params = useParams();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(248);
  const [shares, setShares] = useState(64);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        // Try API first
        const result = await fetchEventById(params.id as string);
        
        if (result.data) {
          // Transform API event to display format
          const date = new Date(result.data.date);
          setEvent({
            id: result.data.id,
            title: result.data.title,
            description: result.data.description,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            category: result.data.category,
            image: result.data.image_url,
            video: undefined,
          });
        } else {
          // Fallback to mock data
          const allEvents = [
            ...carTimelineEvents,
            ...ukWarsTimeline,
            ...getAllEvents(),
          ];
          const foundEvent = allEvents.find(e => e.id === params.id);
          setEvent(foundEvent || null);
        }
      } catch (error) {
        console.error('Failed to load event from API, using mock data:', error);
        // Fallback to mock data
        const allEvents = [
          ...carTimelineEvents,
          ...ukWarsTimeline,
          ...getAllEvents(),
        ];
        const foundEvent = allEvents.find(e => e.id === params.id);
        setEvent(foundEvent || null);
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      loadEvent();
    }
  }, [params.id]);

  // Mock comments data
  const mockComments = [
    {
      id: "1",
      author: "TimelineEnthusiast",
      content: "This is such an important moment in history! Thanks for documenting this.",
      timestamp: "2 hours ago",
      likes: 12,
    },
    {
      id: "2", 
      author: "HistoryBuff",
      content: "Great details on this event. Would love to see more like this.",
      timestamp: "5 hours ago",
      likes: 8,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Timeline
          </Button>
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground">This timeline event does not exist.</p>
          </Card>
        </main>
      </div>
    );
  }

  const formatDate = (year: number, month?: number, day?: number) => {
    if (day && month) {
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (month) {
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }
    return year.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timeline
        </Button>

        {/* Event Detail Card */}
        <Card className="p-8">
          {/* Multimedia Content */}
          {(event.image || event.video) && (
            <div className="mb-6 rounded-lg overflow-hidden">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              )}
              {event.video && (
                <video 
                  src={event.video}
                  controls
                  className="w-full h-auto max-h-[500px]"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span className="text-lg font-medium">
                {formatDate(event.year, event.month, event.day)}
              </span>
            </div>
            {event.category && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                      event.category === "vehicle"
                        ? "bg-primary/10 text-primary"
                        : event.category === "crisis"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {event.category}
                  </span>
                </div>
              </>
            )}
          </div>

          <h1 className="text-4xl font-display font-bold mb-6">{event.title}</h1>

          {event.description && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {event.description}
            </p>
          )}

          {/* Social Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant={isLiked ? "default" : "outline"}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setIsLiked(!isLiked);
                setLikes(isLiked ? likes - 1 : likes + 1);
              }}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              {likes}
            </Button>
            <Button 
              variant="outline" 
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              {shares}
            </Button>
            <Button
              // @ts-ignore - Type inference issue with class-variance-authority
              variant={isFollowing ? "secondary" : "default"}
              // @ts-ignore - Type inference issue with class-variance-authority
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <UserPlus className="w-4 h-4" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </Card>

        {/* Comments Section */}
        <Card className="p-6 mt-6">
          <CommentsSection comments={mockComments} />
        </Card>
      </main>
    </div>
  );
};

export default Story;
