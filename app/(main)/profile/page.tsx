"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Trash2, Settings, LogOut, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockUserStories = [
  {
    id: "1",
    content: "Just saw a pigeon steal an entire sandwich from a businessman...",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    reactions: 1200,
    views: 5400,
  },
  {
    id: "2",
    content: "My neighbor has been playing the same 3 seconds of a song on repeat...",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reactions: 345,
    views: 1890,
  },
];

const Profile = () => {
  const router = useRouter();
  const [isSignedIn] = useState(false);

  function formatDistance(date: Date) {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl mx-auto">
              👤
            </div>
            <h1 className="text-3xl font-bold">Sign in to view your profile</h1>
            <p className="text-muted-foreground">
              Create an account to share your stories and see your activity
            </p>
            <Button size="lg" onClick={() => router.push("/auth")}>
              Sign In / Sign Up
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold">Your Stories</h1>
                <p className="text-muted-foreground mb-2">
                  {mockUserStories.length} stories posted
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">342</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">128</span>
                    <span className="text-muted-foreground">Following</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                // @ts-ignore - Type inference issue with class-variance-authority
                variant="outline"
                // @ts-ignore - Type inference issue with class-variance-authority
                size="icon"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                // @ts-ignore - Type inference issue with class-variance-authority
                variant="outline"
                // @ts-ignore - Type inference issue with class-variance-authority
                size="icon"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Timeline Creator</Badge>
            <Badge variant="secondary">History Enthusiast</Badge>
          </div>
        </Card>

        {/* User Stories */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Stories</h2>
          {mockUserStories.map((story) => (
            <Card key={story.id} className="p-6 hover:shadow-lg transition-all">
              <div className="space-y-4">
                <p className="text-foreground line-clamp-2">{story.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Posted {formatDistance(story.createdAt)}</span>
                  <span>•</span>
                  <span>😂 {story.reactions} reactions</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {story.views} views
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/story/${story.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
