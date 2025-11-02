import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";

interface EventDetailsStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription: string;
  writingStyle: string;
}

export const EventDetailsStep = ({ events, setEvents, timelineDescription, writingStyle }: EventDetailsStepProps) => {
  const updateEventDescription = (id: string, description: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  const generateDescription = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    try {
      const response = await fetch("/api/ai/generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{ year: event.year, title: event.title }],
          timelineDescription,
          writingStyle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        updateEventDescription(id, data.descriptions[0] || "");
      }
    } catch (error) {
      // Mock fallback
      const mockDescription = `This was a pivotal moment in ${event.year} when ${event.title.toLowerCase()}. It marked a significant milestone in the journey.`;
      updateEventDescription(id, mockDescription);
    }
  };

  const generateAllDescriptions = async () => {
    try {
      const response = await fetch("/api/ai/generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map(e => ({ year: e.year, title: e.title })),
          timelineDescription,
          writingStyle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(
          events.map((e, idx) => ({
            ...e,
            description: data.descriptions[idx] || e.description,
          }))
        );
      }
    } catch (error) {
      // Mock fallback
      setEvents(
        events.map((e) => ({
          ...e,
          description: `This was a pivotal moment in ${e.year} when ${e.title.toLowerCase()}. It marked a significant milestone in the journey.`,
        }))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 2: Add Event Details
        </h2>
        <p className="text-muted-foreground mb-6">
          Add detailed descriptions for each timeline event
        </p>
        <Button
          onClick={generateAllDescriptions}
          size="lg"
          className="w-full"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generate All Descriptions with AI
        </Button>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="space-y-3 p-4 border rounded-lg bg-card">
            <div className="flex items-start justify-between">
              <div>
                <Label className="text-base font-semibold">{event.title}</Label>
                <p className="text-sm text-muted-foreground">{event.year}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateDescription(event.id)}
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Generate with AI
              </Button>
            </div>
            <Textarea
              placeholder="Add a detailed description for this event..."
              value={event.description || ""}
              onChange={(e) => updateEventDescription(event.id, e.target.value)}
              rows={4}
              className="resize-none min-h-[100px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

