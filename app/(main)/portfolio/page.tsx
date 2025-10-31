"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineCard } from "@/components/timeline/TimelineCard";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { Plus, Download, Trash2, FileJson, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getOrCreatePortfolioTimeline, fetchEventsByTimelineId, deleteEventById, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const Portfolio = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [savedCards, setSavedCards] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoading(true);
        
        // Get or create portfolio timeline
        const portfolioResult = await getOrCreatePortfolioTimeline();
        if (portfolioResult.error || !portfolioResult.data) {
          console.error('Failed to load portfolio timeline:', portfolioResult.error);
          setSavedCards([]);
          return;
        }

        const portfolioTimeline = portfolioResult.data;

        // Fetch events from portfolio timeline
        const eventsResult = await fetchEventsByTimelineId(portfolioTimeline.id);
        if (eventsResult.data) {
          const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
          setSavedCards(transformedEvents);
        } else {
          setSavedCards([]);
        }
      } catch (error) {
        console.error('Failed to load portfolio:', error);
        setSavedCards([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadPortfolio();
  }, []);

  const handleExport = () => {
    // UI only - would export cards as JSON
    const dataStr = JSON.stringify(savedCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timeline-cards.json";
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      const result = await deleteEventById(id);
      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      setSavedCards(savedCards.filter(card => card.id !== id));
      
      toast({
        title: "Success",
        description: "Card deleted from your portfolio",
      });
    } catch (error: any) {
      console.error("Error deleting card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete card. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[23px] font-bold leading-[28px] mb-1">My Portfolio</h1>
            <p className="text-[15px] text-muted-foreground">
              {savedCards.length} {savedCards.length === 1 ? "card" : "cards"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={() => router.push("/editor")}>
              <Plus className="mr-2 h-4 w-4" />
              New Card
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {savedCards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start building your timeline by creating your first card
              </p>
              <Button onClick={() => router.push("/editor")}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {savedCards.map((card) => (
                <div key={card.id} className="relative group">
                  <TimelineCard event={card} side="left" />
                  
                  {/* Action Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      // @ts-ignore - Type inference issue with class-variance-authority
                      size="icon"
                      // @ts-ignore - Type inference issue with class-variance-authority
                      variant="destructive"
                      className="h-8 w-8 shadow-lg"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {card.category || "event"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Guide */}
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-[15px] font-bold">How to Use Your Cards</CardTitle>
                <CardDescription className="text-[13px]">
                  Build your own timelines with these cards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-[13px]">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-muted-foreground">
                    Export your cards as JSON using the "Export JSON" button
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-muted-foreground">
                    Import the JSON file into any timeline view to display your custom events
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-muted-foreground">
                    Mix and match cards from different portfolios to create unique timelines
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Portfolio;
