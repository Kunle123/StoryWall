"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Trash2, Settings, LogOut, UserPlus, Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchTimelines } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

interface Timeline {
  id: string;
  title: string;
  description?: string;
  view_count: number;
  created_at: string;
  is_public: boolean;
  creator?: {
    username: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [userTimelines, setUserTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserTimelines() {
      if (!isSignedIn || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch timelines created by the current user
        const result = await fetchTimelines({ limit: 100, mine: true });
        
        if (result.data) {
          setUserTimelines(result.data);
        } else {
          setUserTimelines([]);
        }
      } catch (error) {
        console.error('Failed to load timelines:', error);
        setUserTimelines([]);
      } finally {
        setLoading(false);
      }
    }

    loadUserTimelines();
  }, [isSignedIn, user?.id]);

  function formatDistance(dateString: string) {
    const date = new Date(dateString);
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  function formatViews(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
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
              Create an account to save timelines and access them from any device
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
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.fullName || user?.firstName || "Your Profile"}</h1>
                <p className="text-muted-foreground mb-2">
                  {loading ? "Loading..." : `${userTimelines.length} timeline${userTimelines.length !== 1 ? 's' : ''} created`}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {userTimelines.reduce((sum, t) => sum + t.view_count, 0)}
                    </span>
                    <span className="text-muted-foreground">total views</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/editor")}
                title="Create New Timeline"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Timeline Creator</Badge>
            {userTimelines.length > 0 && (
              <Badge variant="secondary">{userTimelines.length} Timeline{userTimelines.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </Card>

        {/* User Timelines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Timelines</h2>
            <Button onClick={() => router.push("/editor")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Timeline
            </Button>
          </div>
          
          {loading ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">Loading your timelines...</p>
            </Card>
          ) : userTimelines.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-4xl">📅</div>
                <h3 className="text-xl font-semibold">No timelines yet</h3>
                <p className="text-muted-foreground">
                  Create your first timeline to get started. Your timelines will be saved permanently and accessible from any device.
                </p>
                <Button onClick={() => router.push("/editor")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Timeline
                </Button>
              </div>
            </Card>
          ) : (
            userTimelines.map((timeline) => (
              <Card key={timeline.id} className="p-6 hover:shadow-lg transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{timeline.title}</h3>
                      {timeline.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {timeline.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created {formatDistance(timeline.created_at)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatViews(timeline.view_count)} views
                        </div>
                        {timeline.is_public ? (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">Public</Badge>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/timeline/${timeline.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Timeline
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={async () => {
                        if (confirm(`Delete "${timeline.title}"? This action cannot be undone.`)) {
                          // TODO: Implement delete functionality
                          toast({
                            title: "Delete Timeline",
                            description: "Delete functionality will be implemented soon.",
                          });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
