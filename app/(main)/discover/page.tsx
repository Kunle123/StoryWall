"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Clock } from "lucide-react";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Mock data for discovery
  const trendingTimelines = [
    { id: 1, title: "Automotive History", creator: "CarEnthusiast", views: "12.4k", category: "Technology", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CarEnthusiast" },
    { id: 2, title: "Space Exploration", creator: "AstroNerd", views: "8.9k", category: "Science", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AstroNerd" },
    { id: 3, title: "Music Evolution", creator: "MusicLover", views: "6.2k", category: "Culture", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MusicLover" },
  ];

  const recentTimelines = [
    { id: 4, title: "AI Development", creator: "TechGuru", views: "5.1k", category: "Technology", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TechGuru" },
    { id: 5, title: "Fashion Through Ages", creator: "StyleIcon", views: "4.3k", category: "Culture", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=StyleIcon" },
    { id: 6, title: "Medical Breakthroughs", creator: "HealthPro", views: "3.8k", category: "Science", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HealthPro" },
  ];

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
          </div>
          <div>
            {trendingTimelines.map((timeline, index) => (
              <div key={timeline.id}>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => router.push("/")}
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
          </div>
          <div>
            {recentTimelines.map((timeline, index) => (
              <div key={timeline.id}>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => router.push("/")}
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

