import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { useToast } from "@/hooks/use-toast";

interface EventDetailsStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription: string;
  writingStyle: string;
}

export const EventDetailsStep = ({ events, setEvents, timelineDescription, writingStyle }: EventDetailsStepProps) => {
  const { toast } = useToast();

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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.details || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (!data.descriptions || data.descriptions.length === 0) {
        throw new Error("No description was generated");
      }

      updateEventDescription(id, data.descriptions[0] || "");
      toast({
        title: "Success!",
        description: "Description generated",
      });
    } catch (error: any) {
      console.error("Error generating description:", error);
      toast({
        title: "Failed to generate description",
        description: error.message || "Please check your OpenAI API key configuration and try again.",
        variant: "destructive",
      });
    }
  };

  const generateAllDescriptions = async () => {
    if (events.length === 0) {
      toast({
        title: "No events",
        description: "Please add events first.",
        variant: "destructive",
      });
      return;
    }

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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.details || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (!data.descriptions || data.descriptions.length === 0) {
        throw new Error("No descriptions were generated");
      }

      setEvents(
        events.map((e, idx) => ({
          ...e,
          description: data.descriptions[idx] || e.description,
        }))
      );
      toast({
        title: "Success!",
        description: `Generated descriptions for ${events.length} events`,
      });
    } catch (error: any) {
      console.error("Error generating descriptions:", error);
      toast({
        title: "Failed to generate descriptions",
        description: error.message || "Please check your OpenAI API key configuration and try again.",
        variant: "destructive",
      });
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

