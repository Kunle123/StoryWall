import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Sparkles, Loader2, CalendarIcon } from "lucide-react";
import { TimelineEvent } from "@/pages/TimelineEditor";
import { useState } from "react";
import { useCredits } from "@/hooks/use-credits";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WritingStyleStepProps {
  writingStyle: string;
  setWritingStyle: (style: string) => void;
  customStyle: string;
  setCustomStyle: (style: string) => void;
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  onAIGenerate: () => void;
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
  customStyle,
  setCustomStyle,
  events,
  setEvents,
  onAIGenerate,
}: WritingStyleStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { deductCredits } = useCredits();

  const handleGenerateEvents = async () => {
    if (!deductCredits(10, "AI Event Generation")) {
      return;
    }
    
    onAIGenerate();
    setIsGenerating(true);
    // Mock AI generation - generates up to 20 events
    await new Promise(resolve => setTimeout(resolve, 1500));
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
    setHasGenerated(true);
    setIsGenerating(false);
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

      {/* AI Generation Section */}
      <div className="border-2 border-primary/20 rounded-lg p-6 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-lg font-semibold">AI-Powered Generation</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select a writing style and let AI generate your timeline events
        </p>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-3 block">Writing Style</Label>
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
          
          <div>
            <Label className="text-sm mb-2 block">Custom Style (Optional)</Label>
            <Textarea
              placeholder="e.g., in the style of Jack Bauer from the television series 24"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleGenerateEvents}
            disabled={(!writingStyle && !customStyle) || isGenerating || hasGenerated}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : hasGenerated ? "Events Generated" : "Generate Events with AI (10 credits)"}
          </Button>
        </div>
      </div>

      {/* Manual Entry Section */}
      <div className="border rounded-lg p-6">
        <Label className="text-lg font-semibold mb-4 block">Manual Entry</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Add timeline events manually one by one
        </p>
        <Button variant="outline" onClick={addEvent} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Event Manually
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !event.year && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {event.year ? format(new Date(event.year, 0, 1), "yyyy") : <span>Pick a year</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={event.year ? new Date(event.year, 0, 1) : undefined}
                      onSelect={(date) => date && updateEvent(event.id, "year", date.getFullYear())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  placeholder="Event title"
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEvent(event.id)}
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
