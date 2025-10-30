"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineCard } from "@/components/timeline/TimelineCard";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { Plus, Download, Trash2, FileJson } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Portfolio = () => {
  const router = useRouter();
  
  // Mock saved cards - would come from state/storage in real implementation
  const [savedCards] = useState<TimelineEvent[]>([
    {
      id: "1",
      year: 2024,
      month: 3,
      day: 15,
      title: "My First Timeline Event",
      description: "This is an example of a saved timeline card in your portfolio.",
      category: "milestone",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "2",
      year: 2023,
      month: 7,
      title: "Summer Innovation",
      description: "Another card example showing how your portfolio collection works.",
      category: "innovation",
    },
    {
      id: "3",
      year: 2024,
      month: 1,
      day: 1,
      title: "New Year Milestone",
      description: "Starting the year with an important event.",
      category: "event",
    },
  ]);

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

  const handleDelete = (id: string) => {
    // UI only - would delete from storage
    console.log("Deleting card:", id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">My Portfolio</h1>
            <p className="text-muted-foreground">
              Your collection of timeline cards • {savedCards.length} {savedCards.length === 1 ? "card" : "cards"}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {savedCards.map((card) => (
                <div key={card.id} className="relative group">
                  <TimelineCard event={card} side="left" />
                  
                  {/* Action Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
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
                <CardTitle className="text-lg font-display">How to Use Your Cards</CardTitle>
                <CardDescription>
                  Build your own timelines with these cards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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
