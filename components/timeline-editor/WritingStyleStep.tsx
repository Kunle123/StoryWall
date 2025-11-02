import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";

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
  const handleGenerateEvents = async () => {
    // Call AI API to generate events
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

      if (!response.ok) {
        throw new Error("Failed to generate events");
      }

      const data = await response.json();
      const generatedEvents: TimelineEvent[] = data.events.map((e: any, idx: number) => ({
        id: `event-${Date.now()}-${idx}`,
        year: e.year,
        title: e.title,
      }));

      setEvents(generatedEvents);
    } catch (error) {
      // Mock fallback
      const mockEvents: TimelineEvent[] = [
        { id: "1", year: 1920, title: "British Mandate Begins" },
        { id: "2", year: 1936, title: "Arab Revolt" },
        { id: "3", year: 1947, title: "UN Partition Plan" },
        { id: "4", year: 1948, title: "Declaration of Israeli Independence" },
        { id: "5", year: 1967, title: "Six-Day War" },
        { id: "6", year: 1973, title: "Yom Kippur War" },
        { id: "7", year: 1987, title: "First Intifada" },
        { id: "8", year: 1993, title: "Oslo Accords" },
        { id: "9", year: 2000, title: "Second Intifada" },
        { id: "10", year: 2005, title: "Gaza Disengagement" },
      ];
      setEvents(mockEvents);
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
          disabled={!writingStyle}
          className="flex-1"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Events with AI
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

