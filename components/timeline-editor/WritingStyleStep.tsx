import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCredits } from "@/hooks/use-credits";

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface WritingStyleStepProps {
  writingStyle: string;
  setWritingStyle: (style: string) => void;
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription?: string;
  timelineName?: string;
}

const writingStyles = [
  "Narrative",
  "Jovial",
  "Professional",
  "Casual",
  "Academic",
  "Poetic",
];

export const WritingStyleStep = ({
  writingStyle,
  setWritingStyle,
  events,
  setEvents,
  timelineDescription = "",
  timelineName = "",
}: WritingStyleStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const { deductCredits } = useCredits();

  const handleGenerateEvents = async () => {
    if (!timelineDescription || !timelineName) {
      toast({
        title: "Missing information",
        description: "Please provide timeline name and description first.",
        variant: "destructive",
      });
      return;
    }

    // Deduct credits before generating
    const creditsDeducted = await deductCredits(10, "AI Event Generation");
    if (!creditsDeducted) {
      toast({
        title: "Insufficient Credits",
        description: "You need 10 credits for AI Event Generation. Click the credits button to purchase more.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Credits Used",
      description: "10 credits used for AI Event Generation",
    });

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineDescription,
          timelineName,
          maxEvents: 20,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, get text
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.details || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (!data.events || data.events.length === 0) {
        throw new Error("No events were generated");
      }

      const generatedEvents: TimelineEvent[] = data.events.map((e: any, idx: number) => ({
        id: `event-${Date.now()}-${idx}`,
        year: e.year,
        title: e.title,
      }));

      setEvents(generatedEvents);
      toast({
        title: "Success!",
        description: `Generated ${generatedEvents.length} events`,
      });
    } catch (error: any) {
      console.error("Error generating events:", error);
      toast({
        title: "Failed to generate events",
        description: error.message || "Please check your OpenAI API key configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      title: "",
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof TimelineEvent, value: any) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 2: Writing Style & Events
        </h2>
        <p className="text-muted-foreground mb-6">
          Select a writing style and generate or add timeline events
        </p>
      </div>

      {/* Writing Style Selection */}
      <div>
        <Label className="text-base mb-3 block">Select Writing Style</Label>
        <div className="flex flex-wrap gap-2">
          {writingStyles.map((style) => (
            <Badge
              key={style}
              variant={writingStyle === style ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setWritingStyle(style)}
            >
              {style}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Generate Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleGenerateEvents}
          disabled={!writingStyle || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Generate Events with AI"}
        </Button>
        <Button variant="outline" onClick={addEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Add Manually
        </Button>
      </div>

      {/* Events List */}
      {events.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base">Timeline Events</Label>
          {events.map((event) => (
            <div
              key={event.id}
              className="flex gap-3 items-start p-4 border rounded-lg bg-card"
            >
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Year"
                  type="number"
                  value={event.year}
                  onChange={(e) =>
                    updateEvent(event.id, "year", parseInt(e.target.value))
                  }
                  className="w-32 h-10"
                />
                <Input
                  placeholder="Event title"
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEvent(event.id)}
                className="h-10 w-10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

