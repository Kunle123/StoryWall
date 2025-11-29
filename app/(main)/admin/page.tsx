"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, Image, CreditCard, TrendingUp, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalTimelines: number;
  totalEvents: number;
  totalImages: number;
  totalCredits: number;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    credits: number;
    createdAt: string;
  }>;
  recentTimelines: Array<{
    id: string;
    title: string;
    eventCount: number;
    isPublic: boolean;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const { isSignedIn, user: clerkUser } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      try {
        // Get user email from Clerk
        const email = clerkUser?.emailAddresses[0]?.emailAddress;
        
        if (!email) {
          setError("Could not retrieve your email address");
          setLoading(false);
          return;
        }

        // Check if user is admin
        const response = await fetch(`/api/admin/check-access?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (!response.ok || !data.isAdmin) {
          setError("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        await loadStats();
      } catch (err: any) {
        console.error("Error checking admin access:", err);
        setError("Failed to verify admin access");
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [isSignedIn, clerkUser, router]);

  async function loadStats() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      
      if (!response.ok) {
        throw new Error("Failed to load stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading stats:", err);
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-md mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">{error || "Admin privileges required to access this page."}</p>
              <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Manage your StoryWall platform</p>
        </div>

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Timelines</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalTimelines.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalEvents.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalImages.toLocaleString()}</p>
                  </div>
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalCredits.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </div>

            {/* Recent Users */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-right p-2">Credits</th>
                      <th className="text-left p-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.username}</td>
                        <td className="p-2 text-muted-foreground">{user.email}</td>
                        <td className="p-2 text-right">{user.credits.toLocaleString()}</td>
                        <td className="p-2 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent Timelines */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Timelines</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-right p-2">Events</th>
                      <th className="text-left p-2">Visibility</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTimelines.map((timeline) => (
                      <tr key={timeline.id} className="border-b">
                        <td className="p-2 font-medium">{timeline.title}</td>
                        <td className="p-2 text-right">{timeline.eventCount}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            timeline.isPublic 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {timeline.isPublic ? 'Public' : 'Private'}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {new Date(timeline.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/timeline/${timeline.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        <div className="mt-8">
          <Button onClick={loadStats} variant="outline">
            Refresh Stats
          </Button>
        </div>
      </div>
    </div>
  );
}

