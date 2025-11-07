"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Clock, Share2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTimelines } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface TimelineDisplay {
  id: string;
  title: string;
  description?: string;
  creator: string;
  creatorId?: string;
  views: string;
  viewCount: number;
  category: string;
  avatar: string;
  createdAt: string;
  previewImage?: string;
  isPublic: boolean;
}

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [allTimelines, setAllTimelines] = useState<TimelineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle header hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function loadTimelines() {
      try {
        setLoading(true);
        // Fetch public timelines from API
        const result = await fetchTimelines({ limit: 100, is_public: true });
        
        if (result.data && result.data.length > 0) {
          // Transform API timelines to display format
          const transformed = result.data.map((t: any) => {
            // Get first event's image as preview if available
            const previewImage = t.events && t.events.length > 0 && t.events[0].image_url 
              ? t.events[0].image_url 
              : undefined;

            return {
              id: t.id,
              title: t.title,
              description: t.description,
              creator: t.creator?.username || 'Unknown',
              creatorId: t.creator_id,
              views: formatViews(t.view_count || 0),
              viewCount: t.view_count || 0,
              category: 'History', // Default category, could be added to timeline model
              avatar: t.creator?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.creator?.id || t.id}`,
              createdAt: t.created_at,
              previewImage,
              isPublic: t.is_public !== false,
            };
          });
          setAllTimelines(transformed);
        } else {
          setAllTimelines([]);
        }
      } catch (error) {
        console.error('Failed to load timelines from API:', error);
        setAllTimelines([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadTimelines();
  }, []);

  function formatViews(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  }

  const handleShare = async (timelineId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to timeline
    const url = `${window.location.origin}/timeline/${timelineId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out "${title}" on StoryWall`,
          text: `Check out this timeline: ${title}`,
          url: url,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Timeline link copied to clipboard",
        });
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Timeline link copied to clipboard",
          });
        } catch (clipboardError) {
          toast({
            title: "Failed to share",
            description: "Please try copying the link manually",
            variant: "destructive",
          });
        }
      }
    }
  };

  // Filter timelines based on search and category
  const filteredTimelines = useMemo(() => {
    let filtered = allTimelines;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.creator.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    return filtered;
  }, [allTimelines, searchQuery, selectedCategory]);
  
  // Sort by views (trending = highest views)
  const trendingTimelines = useMemo(() => {
    return [...filteredTimelines].sort((a, b) => b.viewCount - a.viewCount);
  }, [filteredTimelines]);

  // Recent = sort by created date (newest first)
  const recentTimelines = useMemo(() => {
    return [...filteredTimelines].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTimelines]);

  const categories = ["Technology", "Science", "Culture", "History", "Art", "Sports"];

  const TimelineCard = ({ timeline }: { timeline: TimelineDisplay }) => (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all border-b border-x-0 rounded-none hover:bg-accent/5"
      onClick={() => router.push(`/timeline/${timeline.id}`)}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={timeline.avatar} alt={timeline.creator} />
          <AvatarFallback>{timeline.creator[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">{timeline.creator}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(timeline.createdAt)}</span>
              </div>
              <h3 className="font-semibold text-base mb-1 leading-tight">{timeline.title}</h3>
              {timeline.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {timeline.description}
                </p>
              )}
            </div>
            {timeline.previewImage && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img
                  src={timeline.previewImage}
                  alt={timeline.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {timeline.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>{timeline.views} views</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 hover:bg-muted"
              onClick={(e) => handleShare(timeline.id, timeline.title, e)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-40">
      <Header isVisible={showHeader} />
      <main className={`container mx-auto px-3 max-w-4xl transition-all duration-300 ${
        showHeader ? 'pt-16' : 'pt-4'
      }`}>
        {/* Search Bar - moves up when header hides */}
        <div 
          className={`fixed left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 transition-all duration-300 ${
            showHeader ? 'top-12' : 'top-0'
          }`}
          style={{ height: '56px' }}
        >
          <div className="container mx-auto px-3 h-full flex items-center max-w-4xl">
            <div className="relative flex-1">
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
        </div>

        {/* Spacer for fixed search bar */}
        <div style={{ height: '56px' }} />

        {/* Categories */}
        <div className="py-4 border-b border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap h-7 text-xs"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap h-7 text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <Tabs defaultValue="trending" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-6">
            <section>
              <div className="flex items-center gap-2 px-4 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-xl">Trending Now</h2>
                <span className="text-sm text-muted-foreground">
                  ({trendingTimelines.length} {trendingTimelines.length === 1 ? 'timeline' : 'timelines'})
                </span>
              </div>
              <div>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading timelines...
                  </div>
                ) : trendingTimelines.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery || selectedCategory 
                      ? "No timelines match your filters" 
                      : "No public timelines yet. Be the first to create one!"}
                  </div>
                ) : (
                  trendingTimelines.map((timeline) => (
                    <TimelineCard key={timeline.id} timeline={timeline} />
                  ))
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <section>
              <div className="flex items-center gap-2 px-4 mb-3">
                <Clock className="w-5 h-5 text-accent" />
                <h2 className="font-display font-bold text-xl">Recently Added</h2>
                <span className="text-sm text-muted-foreground">
                  ({recentTimelines.length} {recentTimelines.length === 1 ? 'timeline' : 'timelines'})
                </span>
              </div>
              <div>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading timelines...
                  </div>
                ) : recentTimelines.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery || selectedCategory 
                      ? "No timelines match your filters" 
                      : "No public timelines yet. Be the first to create one!"}
                  </div>
                ) : (
                  recentTimelines.map((timeline) => (
                    <TimelineCard key={timeline.id} timeline={timeline} />
                  ))
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Discover;
