import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Coins } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCredits } from "@/hooks/use-credits";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";

interface EventDetailsStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription: string;
  writingStyle: string;
  imageStyle?: string; // Optional - if provided, generate image prompts too
  themeColor?: string; // Optional - if provided, include in image prompts
}

const CREDIT_COST_DESCRIPTION = 2;

export const EventDetailsStep = ({ events, setEvents, timelineDescription, writingStyle, imageStyle, themeColor }: EventDetailsStepProps) => {
  const { toast } = useToast();
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [dialogContext, setDialogContext] = useState<{ required: number; action: string; onContinue?: () => void } | null>(null);
  const [generatedEventIds, setGeneratedEventIds] = useState<Set<string>>(new Set());
  const { deductCredits, credits } = useCredits();

  const updateEventDescription = (id: string, description: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  const generateDescription = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    // Deduct credits before generating
    const creditsDeducted = await deductCredits(CREDIT_COST_DESCRIPTION, "AI Description Generation");
    if (!creditsDeducted) {
      setDialogContext({ required: CREDIT_COST_DESCRIPTION, action: "AI Description Generation" });
      setShowCreditsDialog(true);
      return;
    }

    setGeneratingId(id);
    try {
      const response = await fetch("/api/ai/generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{ year: event.year, title: event.title }],
          timelineDescription,
          writingStyle,
          ...(imageStyle && { imageStyle, themeColor }), // Include if available
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

      // Update event with description and image prompt (if available)
      const eventIndex = events.findIndex((e) => e.id === id);
      if (eventIndex !== -1) {
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = {
          ...updatedEvents[eventIndex],
          description: data.descriptions[0] || "",
          imagePrompt: data.imagePrompts?.[0] || updatedEvents[eventIndex].imagePrompt,
        };
        setEvents(updatedEvents);
      } else {
        updateEventDescription(id, data.descriptions[0] || "");
      }
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
    } finally {
      setGeneratingId(null);
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

    const eventsWithoutDescriptions = events.filter(e => !e.description).length;
    const totalCost = eventsWithoutDescriptions * CREDIT_COST_DESCRIPTION;
    
    // Deduct credits before generating
    const creditsDeducted = await deductCredits(
      totalCost, 
      `AI Description Generation for ${eventsWithoutDescriptions} events`
    );
    if (!creditsDeducted) {
      setDialogContext({ 
        required: totalCost, 
        action: `AI Description Generation for ${eventsWithoutDescriptions} events`,
        onContinue: () => {
          toast({
            title: "Continue Without AI",
            description: "You can manually add descriptions to events.",
          });
        }
      });
      setShowCreditsDialog(true);
      return;
    }

    setIsGeneratingAll(true);
    try {
      const response = await fetch("/api/ai/generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map(e => ({ year: e.year, title: e.title })),
          timelineDescription,
          writingStyle,
          ...(imageStyle && { imageStyle, themeColor }), // Include if available for image prompt generation
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
          imagePrompt: data.imagePrompts?.[idx] || e.imagePrompt, // Store AI-generated image prompts
        }))
      );
      // Mark all events as generated
      setGeneratedEventIds(new Set(events.map(e => e.id)));
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
    } finally {
      setIsGeneratingAll(false);
    }
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
          disabled={isGeneratingAll || events.length === 0 || generatedEventIds.size === events.length}
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
        <p className="text-sm text-muted-foreground text-center mt-2">
          or type your descriptions in the boxes below
        </p>
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

      {dialogContext && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          onOpenChange={setShowCreditsDialog}
          required={dialogContext.required}
          current={credits}
          action={dialogContext.action}
          onBuyCredits={() => {
            const headerButton = document.querySelector('[data-buy-credits]');
            if (headerButton) {
              (headerButton as HTMLElement).click();
            } else {
              toast({
                title: "Buy Credits",
                description: "Click the credits button in the header to purchase more credits.",
              });
            }
          }}
          onContinueWithout={dialogContext.onContinue}
        />
      )}
    </div>
  );
};

