import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { SubMenuBar } from "@/components/SubMenuBar";
import { BottomMenuBar } from "@/components/BottomMenuBar";
import { DiscoverCardSkeleton } from "@/components/DiscoverCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedTrending, setDisplayedTrending] = useState(3);
  const [displayedRecent, setDisplayedRecent] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Load more content
  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setDisplayedTrending(prev => Math.min(prev + 2, trendingTimelines.length));
      setDisplayedRecent(prev => Math.min(prev + 2, recentTimelines.length));
      setIsLoadingMore(false);
    }, 1000);
  }, [isLoadingMore]);
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || isLoading) return;
    
    const hasMore = displayedTrending < trendingTimelines.length || 
                    displayedRecent < recentTimelines.length;
    
    if (!hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [displayedTrending, displayedRecent, isLoadingMore, loadMore, isLoading]);

  // Mock data for discovery
  const trendingTimelines = [
    { 
      id: 1, 
      title: "Automotive History", 
      creator: "CarEnthusiast", 
      views: "12.4k", 
      category: "Technology",
      snippet: "Explore the evolution of automobiles from the first steam-powered vehicles to modern electric cars.",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop"
    },
    { 
      id: 2, 
      title: "Space Exploration", 
      creator: "AstroNerd", 
      views: "8.9k", 
      category: "Science",
      snippet: "Journey through humanity's quest to explore the cosmos, from Sputnik to Mars rovers.",
      image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&auto=format&fit=crop"
    },
    { 
      id: 3, 
      title: "Music Evolution", 
      creator: "MusicLover", 
      views: "6.2k", 
      category: "Culture",
      snippet: "Discover how music has evolved through the decades, from classical to hip-hop.",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop"
    },
  ];

  const recentTimelines = [
    { 
      id: 4, 
      title: "AI Development", 
      creator: "TechGuru", 
      views: "5.1k", 
      category: "Technology",
      snippet: "The fascinating journey of artificial intelligence from early concepts to modern neural networks.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop"
    },
    { 
      id: 5, 
      title: "Fashion Through Ages", 
      creator: "StyleIcon", 
      views: "4.3k", 
      category: "Culture",
      snippet: "A visual journey through fashion trends and styles that defined each era.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop"
    },
    { 
      id: 6, 
      title: "Medical Breakthroughs", 
      creator: "HealthPro", 
      views: "3.8k", 
      category: "Science",
      snippet: "Revolutionary medical discoveries that changed the course of human health and longevity.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop"
    },
  ];

  const categories = ["Technology", "Science", "Culture", "History", "Art", "Sports"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onVisibilityChange={setIsHeaderVisible} />
      <SubMenuBar title="Discover" headerVisible={isHeaderVisible} />
      <main className="container mx-auto px-3 pt-[56px] max-w-4xl">
        {/* Search Bar */}
        <div className="sticky top-[44px] z-40 bg-background py-3 border-b border-border/50 transition-[top] duration-300">
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
          <div className="flex items-center gap-2 px-4 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-display">Trending Now</h2>
          </div>
          <div className="grid gap-4 px-4">
            {isLoading ? (
              <>
                <DiscoverCardSkeleton />
                <DiscoverCardSkeleton />
                <DiscoverCardSkeleton />
              </>
            ) : (
              trendingTimelines.slice(0, displayedTrending).map((timeline) => (
              <Card
                key={timeline.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/")}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                    <img
                      src={timeline.image}
                      alt={timeline.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg font-display line-clamp-2">{timeline.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                        {timeline.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {timeline.snippet}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{timeline.creator}</span>
                      <span>·</span>
                      <span>{timeline.views} views</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </section>

        {/* Recent Section */}
        <section className="mt-8 mb-6">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold font-display">Recently Added</h2>
          </div>
          <div className="grid gap-4 px-4">
            {isLoading ? (
              <>
                <DiscoverCardSkeleton />
                <DiscoverCardSkeleton />
                <DiscoverCardSkeleton />
              </>
            ) : (
              recentTimelines.slice(0, displayedRecent).map((timeline) => (
              <Card
                key={timeline.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/")}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                    <img
                      src={timeline.image}
                      alt={timeline.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg font-display line-clamp-2">{timeline.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent whitespace-nowrap">
                        {timeline.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {timeline.snippet}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{timeline.creator}</span>
                      <span>·</span>
                      <span>{timeline.views} views</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </section>
        
        {/* Load more trigger */}
        {!isLoading && (displayedTrending < trendingTimelines.length || displayedRecent < recentTimelines.length) && (
          <div ref={loadMoreRef} className="py-6 px-4">
            {isLoadingMore && (
              <div className="grid gap-4">
                <DiscoverCardSkeleton />
                <DiscoverCardSkeleton />
              </div>
            )}
          </div>
        )}
      </main>
      <BottomMenuBar />
    </div>
  );
};

export default Discover;
