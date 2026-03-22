"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Clock, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTimelines, fetchFeaturedTimelines } from "@/lib/api/client";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { DiscoverCardSkeleton } from "@/components/timeline/DiscoverCardSkeleton";
import { StorySummaryCard } from "@/components/timeline/StorySummaryCard";
import { FeaturedStorySpotlight } from "@/components/timeline/FeaturedStorySpotlight";

interface TimelineDisplay {
  id: string;
  title: string;
  description?: string;
  creator: string;
  creatorId?: string;
  views: string;
  viewCount: number;
  avatar: string;
  createdAt: string;
  /** Up to 3 event images for the strip */
  previewImages: string[];
  eventCount: number;
  hashtags: string[];
  isPublic: boolean;
}

function mapApiTimeline(t: any): TimelineDisplay {
  const events = t.events || [];
  const previewImages = events
    .map((e: { image_url?: string }) => e.image_url)
    .filter(Boolean) as string[];

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    creator: t.creator?.username || "Unknown",
    creatorId: t.creator_id,
    views: formatViewsStatic(t.view_count || 0),
    viewCount: t.view_count || 0,
    avatar:
      t.creator?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.creator?.id || t.id}`,
    createdAt: t.created_at,
    previewImages,
    eventCount: typeof t.event_count === "number" ? t.event_count : events.length,
    hashtags: Array.isArray(t.hashtags) ? t.hashtags : [],
    isPublic: t.is_public !== false,
  };
}

function formatViewsStatic(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

/** First hashtag as a short topic pill, or undefined */
function topicLabel(hashtags: string[]): string | undefined {
  const h = hashtags[0];
  if (!h || !h.trim()) return undefined;
  return h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
}

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const [allTimelines, setAllTimelines] = useState<TimelineDisplay[]>([]);
  const [featuredTimelines, setFeaturedTimelines] = useState<TimelineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function loadTimelines() {
      try {
        setLoading(true);
        const result = await fetchTimelines({ limit: 100, is_public: true });
        if (result.data && result.data.length > 0) {
          setAllTimelines(result.data.map(mapApiTimeline));
        } else {
          setAllTimelines([]);
        }
      } catch (error) {
        console.error("Failed to load timelines from API:", error);
        setAllTimelines([]);
      } finally {
        setLoading(false);
      }
    }

    loadTimelines();

    async function loadFeatured() {
      try {
        setFeaturedLoading(true);
        const result = await fetchFeaturedTimelines(6);
        if (result.data && result.data.length > 0) {
          setFeaturedTimelines(result.data.map(mapApiTimeline));
        } else {
          setFeaturedTimelines([]);
        }
      } catch (error) {
        console.error("Failed to load featured timelines:", error);
        setFeaturedTimelines([]);
      } finally {
        setFeaturedLoading(false);
      }
    }

    loadFeatured();
  }, []);

  const featuredIds = useMemo(
    () => new Set(featuredTimelines.map((t) => t.id)),
    [featuredTimelines]
  );

  const filteredTimelines = useMemo(() => {
    let filtered = allTimelines.filter((t) => !featuredIds.has(t.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const tagHit = t.hashtags.some((h) => h.toLowerCase().includes(query));
        return (
          tagHit ||
          t.title.toLowerCase().includes(query) ||
          (t.description?.toLowerCase().includes(query) ?? false) ||
          t.creator.toLowerCase().includes(query)
        );
      });
    }

    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      filtered = filtered.filter((t) => {
        const tagHit = t.hashtags.some(
          (h) =>
            h.toLowerCase().includes(cat) ||
            cat.includes(h.toLowerCase().slice(0, Math.min(4, h.length)))
        );
        return (
          tagHit ||
          t.title.toLowerCase().includes(cat) ||
          (t.description?.toLowerCase().includes(cat) ?? false)
        );
      });
    }

    return filtered;
  }, [allTimelines, searchQuery, selectedCategory, featuredIds]);

  const trendingTimelines = useMemo(() => {
    return [...filteredTimelines].sort((a, b) => b.viewCount - a.viewCount);
  }, [filteredTimelines]);

  const recentTimelines = useMemo(() => {
    return [...filteredTimelines].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTimelines]);

  const categories = ["Technology", "Science", "Culture", "History", "Art", "Sports"];

  const openTimeline = (id: string) => router.push(`/timeline/${id}`);

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-40">
      <Header isVisible={showHeader} />
      <main
        className={`container mx-auto px-3 max-w-6xl transition-all duration-300 ${
          showHeader ? "pt-16" : "pt-4"
        }`}
      >
        <div
          className={`fixed left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 transition-all duration-300 ${
            showHeader ? "top-12" : "top-0"
          }`}
          style={{ height: "56px" }}
        >
          <div className="container mx-auto px-3 h-full flex items-center max-w-6xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stories, topics, creators…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>

        <div style={{ height: "56px" }} />

        {/* Hero */}
        <div className="px-4 pt-2 pb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Stories to explore
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Scan summaries across timelines—open the ones you want to dive into.
          </p>
        </div>

        {featuredTimelines.length > 0 && (
          <section className="mb-10 px-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-bold font-display">Featured stories</h2>
            </div>
            <div className="grid gap-4">
              {featuredLoading ? (
                <>
                  <DiscoverCardSkeleton />
                  <DiscoverCardSkeleton />
                </>
              ) : (
                featuredTimelines.map((timeline) => (
                  <FeaturedStorySpotlight
                    key={timeline.id}
                    title={timeline.title}
                    summary={timeline.description}
                    creatorName={timeline.creator}
                    creatorAvatar={timeline.avatar}
                    viewLabel={timeline.views}
                    eventCount={timeline.eventCount}
                    previewImages={timeline.previewImages}
                    onClick={() => openTimeline(timeline.id)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        <div className="py-4 border-b border-border/50 px-4">
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

        <Tabs defaultValue="trending" className="mt-6 px-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
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
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold font-display">Trending now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DiscoverCardSkeleton key={i} />
                    ))}
                  </>
                ) : trendingTimelines.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    {searchQuery || selectedCategory
                      ? "No timelines match your filters"
                      : "No public timelines yet. Be the first to create one!"}
                  </div>
                ) : (
                  trendingTimelines.map((timeline) => (
                    <StorySummaryCard
                      key={timeline.id}
                      title={timeline.title}
                      summary={timeline.description}
                      creatorName={timeline.creator}
                      creatorAvatar={timeline.avatar}
                      viewLabel={timeline.views}
                      eventCount={timeline.eventCount}
                      previewImages={timeline.previewImages}
                      topicLabel={topicLabel(timeline.hashtags)}
                      onClick={() => openTimeline(timeline.id)}
                    />
                  ))
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold font-display">Recently added</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DiscoverCardSkeleton key={i} />
                    ))}
                  </>
                ) : recentTimelines.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    {searchQuery || selectedCategory
                      ? "No timelines match your filters"
                      : "No public timelines yet. Be the first to create one!"}
                  </div>
                ) : (
                  recentTimelines.map((timeline) => (
                    <StorySummaryCard
                      key={timeline.id}
                      title={timeline.title}
                      summary={timeline.description}
                      creatorName={timeline.creator}
                      creatorAvatar={timeline.avatar}
                      viewLabel={timeline.views}
                      eventCount={timeline.eventCount}
                      previewImages={timeline.previewImages}
                      topicLabel={topicLabel(timeline.hashtags)}
                      onClick={() => openTimeline(timeline.id)}
                    />
                  ))
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <ExperimentalBottomMenuBar />
    </div>
  );
};

export default Discover;
