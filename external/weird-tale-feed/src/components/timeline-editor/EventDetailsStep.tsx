import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { TimelineEvent } from "@/pages/TimelineEditor";
import { useCredits } from "@/hooks/use-credits";

interface EventDetailsStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
}

export const EventDetailsStep = ({ events, setEvents }: EventDetailsStepProps) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const { deductCredits } = useCredits();

  const updateEventDescription = (id: string, description: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  const generateDescription = async (id: string) => {
    if (!deductCredits(2, "AI Description Generation")) {
      return;
    }
    
    setGeneratingId(id);
    // Mock AI generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    const event = events.find((e) => e.id === id);
    if (event) {
      const mockDescription = `This was a pivotal moment in ${event.year} when ${event.title.toLowerCase()}. It marked a significant milestone in the journey.`;
      updateEventDescription(id, mockDescription);
    }
    setGeneratingId(null);
  };

  const generateAllDescriptions = async () => {
    const eventsWithoutDescriptions = events.filter(e => !e.description).length;
    if (!deductCredits(eventsWithoutDescriptions * 2, `AI Description Generation for ${eventsWithoutDescriptions} events`)) {
      return;
    }
    
    setIsGeneratingAll(true);
    // Mock AI generation for all events
    await new Promise(resolve => setTimeout(resolve, 2000));
    setEvents(
      events.map((e) => ({
        ...e,
        description: `This was a pivotal moment in ${e.year} when ${e.title.toLowerCase()}. It marked a significant milestone in the journey.`,
      }))
    );
    setIsGeneratingAll(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 3: Add Event Details
        </h2>
        <p className="text-muted-foreground mb-6">
          Add detailed descriptions for each timeline event
        </p>
        <Button
          onClick={generateAllDescriptions}
          disabled={isGeneratingAll || events.every(e => e.description)}
          size="lg"
          className="w-full"
        >
          {isGeneratingAll ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isGeneratingAll ? "Generating All..." : "Generate Descriptions with AI"}
        </Button>
      </div>

      <div className="text-center my-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="space-y-3 p-4 border rounded-lg bg-card">
            <div>
              <Label className="text-base font-semibold">{event.title}</Label>
              <p className="text-sm text-muted-foreground">{event.year}</p>
            </div>
            <Textarea
              placeholder="Add a detailed description for this event..."
              value={event.description || ""}
              onChange={(e) => updateEventDescription(event.id, e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
