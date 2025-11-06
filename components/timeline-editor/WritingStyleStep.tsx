import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Loader2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCredits } from "@/hooks/use-credits";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description?: string;
  imageUrl?: string;
  imagePrompt?: string; // AI-generated prompt optimized for image generation
}

interface WritingStyleStepProps {
  writingStyle: string;
  setWritingStyle: (style: string) => void;
  customStyle: string;
  setCustomStyle: (style: string) => void;
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription?: string;
  timelineName?: string;
  isFactual?: boolean;
}

const writingStyles = [
  "Narrative",
  "Jovial",
  "Professional",
  "Casual",
  "Academic",
  "Poetic",
];

const CREDIT_COST_EVENTS = 10;

export const WritingStyleStep = ({
  writingStyle,
  setWritingStyle,
  customStyle,
  setCustomStyle,
  events,
  setEvents,
  timelineDescription = "",
  timelineName = "",
  isFactual = true,
}: WritingStyleStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const { deductCredits, credits } = useCredits();

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
    const creditsDeducted = await deductCredits(CREDIT_COST_EVENTS, "AI Event Generation");
    if (!creditsDeducted) {
      setShowCreditsDialog(true);
      return;
    }
    
    toast({
      title: "Credits Used",
      description: `${CREDIT_COST_EVENTS} credits used for AI Event Generation`,
    });

    setIsGenerating(true);
    try {
      console.log('[GenerateEvents] Starting generation:', { 
        timelineName, 
        descriptionLength: timelineDescription?.length,
        isFactual 
      });
      
      // Create AbortController for timeout handling (important for mobile networks)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      let response;
      try {
        response = await fetch("/api/ai/generate-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timelineDescription,
            timelineName,
            maxEvents: 20,
            isFactual,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please check your connection and try again.");
        }
        throw fetchError;
      }
      
      console.log('[GenerateEvents] Response status:', response.status, response.statusText);

      // Read response body once - can't read it twice
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, use the text as error message
        console.error('[GenerateEvents] Failed to parse JSON response:', responseText);
        throw new Error(responseText || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.details || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('[GenerateEvents] API error:', { status: response.status, data, errorMsg });
        throw new Error(errorMsg);
      }

      if (!data.events || data.events.length === 0) {
        console.warn('[GenerateEvents] No events in response:', data);
        
        // Check if there's an error message in the response
        if (data.error) {
          throw new Error(data.error + (data.details ? ` ${data.details}` : ''));
        }
        
        throw new Error("No events were generated. The AI may have been uncertain about the topic. Please try again or provide more details in your timeline description.");
      }

      console.log('[GenerateEvents] Successfully parsed events:', data.events.length);

      const generatedEvents: TimelineEvent[] = data.events.map((e: any, idx: number) => ({
        id: `event-${Date.now()}-${idx}`,
        year: e.year,
        title: e.title,
      }));

      setEvents(generatedEvents);
      setHasGenerated(true); // Disable button after generation
      toast({
        title: "Success!",
        description: `Generated ${generatedEvents.length} events`,
      });
    } catch (error: any) {
      console.error("[GenerateEvents] Error generating events:", error);
      console.error("[GenerateEvents] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // More detailed error message for mobile debugging
      let errorMessage = error.message || "Failed to generate events";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("OPENAI_API_KEY")) {
        errorMessage = "API key not configured. Please contact support.";
      }
      
      toast({
        title: "Failed to generate events",
        description: errorMessage,
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
        <Label className="text-base mb-3 block">1. Select Writing Style</Label>
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
        <div className="mt-4">
          <Label className="text-sm mb-2 block">Or enter a custom style</Label>
          <Textarea
            placeholder="e.g., in the style of Jack Bauer from the television series 24"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>

      {/* AI Generate Button */}
      <div>
        <Label className="text-base mb-3 block">2. Generate with AI or Add Events Manually</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              // If customStyle is set but writingStyle is not, set it
              if (customStyle && !writingStyle) {
                setWritingStyle(customStyle);
              }
              handleGenerateEvents();
            }}
            disabled={(!writingStyle && !customStyle) || isGenerating || hasGenerated}
            className="flex-1 w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : hasGenerated ? "Events Generated" : "Generate with AI"}
            {!isGenerating && !hasGenerated && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Coins className="w-3 h-3 mr-1" />
                {CREDIT_COST_EVENTS}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={addEvent} className="w-full sm:w-auto sm:flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isFactual ? (
            <>
              <strong>Warning:</strong> AI-generated events may contain inaccuracies, especially for recent events (2023-present). The AI has limited knowledge of current events and may hallucinate. <strong>For recent news, campaigns, or current events, we strongly recommend adding events manually</strong> rather than relying on AI generation. Always verify and edit events after generation.
            </>
          ) : (
            <>
              <strong>Note:</strong> AI will generate creative fictional events based on your timeline description. You can edit or add events manually.
            </>
          )}
        </p>
      </div>

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        required={CREDIT_COST_EVENTS}
        current={credits}
        action="AI Event Generation"
        onBuyCredits={() => {
          // Open buy credits modal via Header
          const headerButton = document.querySelector('[data-buy-credits]');
          if (headerButton) {
            (headerButton as HTMLElement).click();
          } else {
            // Fallback: navigate or show toast
            toast({
              title: "Buy Credits",
              description: "Click the credits button in the header to purchase more credits.",
            });
          }
        }}
        onContinueWithout={() => {
          // User can continue by adding events manually
          toast({
            title: "Continue Without AI",
            description: "You can add events manually using the 'Add Manually' button.",
          });
        }}
      />

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

