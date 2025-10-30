"use client";

import { useState } from "react";
import { Timeline } from "@/components/timeline/Timeline";
import { carTimelineEvents } from "@/lib/data/timelineData";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(1247);
  
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
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Interactive Timeline</h1>
          <p className="text-muted-foreground text-lg">
            A powerful timeline component for visualizing any historical data
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Example: Automotive history from 1886 to present
          </p>
        </div>

        <Timeline events={carTimelineEvents} pixelsPerYear={30} />
        
        {/* Timeline Social Interactions */}
        <Card className="p-6 mt-8 bg-card border-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
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
    </div>
  );
};

export default Index;
