"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Clock } from "lucide-react";
import { getAllTimelines } from "@/lib/data/timelineMap";
import { fetchTimelines } from "@/lib/api/client";

interface TimelineDisplay {
  id: string;
  title: string;
  creator: string;
  views: string;
  category: string;
  avatar: string;
}

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [allTimelines, setAllTimelines] = useState<TimelineDisplay[]>(getAllTimelines());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimelines() {
      try {
        setLoading(true);
        // Try to fetch from API
        const result = await fetchTimelines({ limit: 50, is_public: true });
        
        if (result.data && result.data.length > 0) {
          // Transform API timelines to display format
          const transformed = result.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            creator: t.creator?.username || 'Unknown',
            views: `${(t.view_count / 1000).toFixed(1)}k`,
            category: 'History', // Default category, could be added to timeline model
            avatar: t.creator?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.id,
          }));
          // Combine API timelines with mock timelines (mock timelines as fallback)
          const mockTimelines = getAllTimelines();
          setAllTimelines([...transformed, ...mockTimelines]);
        } else {
          // Fallback to mock data - show all 14 timelines
          setAllTimelines(getAllTimelines());
        }
      } catch (error) {
        console.error('Failed to load timelines from API, using mock data:', error);
        setAllTimelines(getAllTimelines());
      } finally {
        setLoading(false);
      }
    }
    
    loadTimelines();
  }, []);
  
  // Sort by views (trending = highest views) - Show ALL timelines
  const trendingTimelines = [...allTimelines]
    .sort((a, b) => {
      const aViews = parseFloat(a.views.replace('k', ''));
      const bViews = parseFloat(b.views.replace('k', ''));
      return bViews - aViews;
    }); // Show all timelines, no limit

  // Recent = reverse order (assuming later added are at end) - Show ALL timelines
  const recentTimelines = [...allTimelines]
    .reverse(); // Show all timelines, no limit

  const categories = ["Technology", "Science", "Culture", "History", "Art", "Sports"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto px-3 pt-16 max-w-4xl">
        {/* Search Bar */}
        <div className="sticky top-12 z-40 bg-background py-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search timelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="py-4 border-b border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                // @ts-ignore - Type inference issue with class-variance-authority
                size="sm"
                className="whitespace-nowrap h-7 text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Trending Section */}
        <section className="mt-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-xl">Trending Now</h2>
            <span className="text-sm text-muted-foreground">({trendingTimelines.length} timelines)</span>
          </div>
          <div>
            {trendingTimelines.map((timeline, index) => (
              <div key={timeline.id}>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => router.push(`/timeline/${timeline.id}`)}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={timeline.avatar} alt={timeline.creator} />
                      <AvatarFallback>{timeline.creator[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{timeline.creator}</span>
                        <span className="text-xs text-muted-foreground">· {timeline.views} views</span>
                      </div>
                      <h3 className="font-semibold text-base mb-1">{timeline.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {timeline.category}
                      </span>
                    </div>
                  </div>
                </div>
                {index < trendingTimelines.length - 1 && (
                  <div className="border-b border-border/50" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Section */}
        <section className="mt-8">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-xl">Recently Added</h2>
            <span className="text-sm text-muted-foreground">({recentTimelines.length} timelines)</span>
          </div>
          <div>
            {recentTimelines.map((timeline, index) => (
              <div key={timeline.id}>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => router.push(`/timeline/${timeline.id}`)}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={timeline.avatar} alt={timeline.creator} />
                      <AvatarFallback>{timeline.creator[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{timeline.creator}</span>
                        <span className="text-xs text-muted-foreground">· {timeline.views} views</span>
                      </div>
                      <h3 className="font-semibold text-base mb-1">{timeline.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {timeline.category}
                      </span>
                    </div>
                  </div>
                </div>
                {index < recentTimelines.length - 1 && (
                  <div className="border-b border-border/50" />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Discover;

