"use client";

import { useState } from "react";
import { Timeline } from "@/components/timeline/Timeline";
import { ukWarsTimeline } from "@/lib/data/timelineData";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { CommentsSection } from "@/components/timeline/CommentsSection";
import { Toaster } from "@/components/ui/toaster";

const UKWarsPage = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(2341);

  const mockComments = [
    {
      id: "1",
      author: "HistoryScholar",
      content: "Fascinating comprehensive timeline. The UK's military history spans over three centuries of global conflict.",
      timestamp: "2 hours ago",
      likes: 45,
    },
    {
      id: "2",
      author: "MilitaryHistoryFan",
      content: "Excellent collection! Interesting to see the evolution from European wars to colonial conflicts to modern interventions.",
      timestamp: "5 hours ago",
      likes: 32,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            UK Wars & Conflicts Timeline
          </h1>
          <p className="text-muted-foreground text-lg">
            A comprehensive timeline of wars and conflicts involving the United Kingdom since 1707
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            From the War of Spanish Succession to modern interventions • {ukWarsTimeline.length} conflicts documented
          </p>
        </div>

        <Timeline events={ukWarsTimeline} pixelsPerYear={15} />

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
    </div>
  );
};

export default UKWarsPage;

