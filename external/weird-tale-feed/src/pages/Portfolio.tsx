import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineCard } from "@/components/TimelineCard";
import { TimelineEvent } from "@/components/Timeline";
import { Plus, Trash2, FileJson, Check } from "lucide-react";
import { CreateTimelineModal } from "@/components/CreateTimelineModal";
import { useToast } from "@/hooks/use-toast";

const Portfolio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const handleDelete = (id: string) => {
    // UI only - would delete from storage
    console.log("Deleting card:", id);
  };

  const handleToggleSelect = (id: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCards(newSelection);
  };

  const handleCreateTimeline = () => {
    if (selectedCards.size === 0) {
      toast({
        title: "No cards selected",
        description: "Please select at least one card to create a timeline",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmTimeline = (name: string, description: string) => {
    console.log("Creating timeline:", { name, description, cards: Array.from(selectedCards) });
    toast({
      title: "Timeline created!",
      description: `"${name}" has been created with ${selectedCards.size} cards`,
    });
    setIsModalOpen(false);
    setIsSelectionMode(false);
    setSelectedCards(new Set());
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedCards(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-16 pb-8 max-w-4xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">My Portfolio</h1>
            <p className="text-sm text-muted-foreground">
              {savedCards.length} {savedCards.length === 1 ? "card" : "cards"}
              {isSelectionMode && ` • ${selectedCards.size} selected`}
            </p>
          </div>
          <div className="flex gap-2">
            {isSelectionMode ? (
              <>
                <Button variant="outline" onClick={handleCancelSelection}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTimeline} disabled={selectedCards.size === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Timeline ({selectedCards.size})
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsSelectionMode(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Timeline
                </Button>
                <Button onClick={() => navigate("/editor")}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Card
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Empty State */}
        {savedCards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">No cards yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Start building your timeline by creating your first card
              </p>
              <Button onClick={() => navigate("/editor")}>
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
                <div 
                  key={card.id} 
                  className={`relative group cursor-pointer ${isSelectionMode ? 'hover:opacity-80' : ''}`}
                  onClick={() => isSelectionMode && handleToggleSelect(card.id)}
                >
                  <TimelineCard event={card} side="left" />
                  
                  {/* Selection Overlay */}
                  {isSelectionMode && (
                    <div className="absolute inset-0 bg-black/10 rounded-lg flex items-start justify-end p-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedCards.has(card.id) 
                          ? 'bg-primary border-primary' 
                          : 'bg-background border-border'
                      }`}>
                        {selectedCards.has(card.id) && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  {!isSelectionMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(card.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Usage Guide */}
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold">How to Use Your Cards</CardTitle>
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
                    Tap the "+Timeline" button to enter selection mode
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-muted-foreground">
                    Select multiple cards by tapping them
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-muted-foreground">
                    Create a timeline by naming it and adding a description
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <CreateTimelineModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedCount={selectedCards.size}
        onConfirm={handleConfirmTimeline}
      />
    </div>
  );
};

export default Portfolio;
