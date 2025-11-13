import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface TimelineEvent {
  id: string;
  year?: number; // Optional for numbered events
  month?: number;
  day?: number;
  number?: number; // For numbered events (1, 2, 3...)
  numberLabel?: string; // Label for numbered events (e.g., "Day", "Event", "Step")
  title: string;
  description?: string;
  imageUrl?: string;
  imagePrompt?: string; // AI-generated prompt optimized for image generation
  hasFamousPeople?: boolean; // Detected if event mentions famous people
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
  isNumbered?: boolean;
  numberLabel?: string;
  maxEvents?: number;
  setImageReferences?: (refs: Array<{ name: string; url: string }>) => void;
  sourceRestrictions?: string[];
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
  timelineDescription = "",
  timelineName = "",
  isFactual = true,
  isNumbered = false,
  numberLabel = "Day",
  maxEvents = 20,
  setImageReferences,
  sourceRestrictions = [],
}: WritingStyleStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerateEvents = async () => {
    if (!timelineDescription || !timelineName) {
      toast({
        title: "Missing information",
        description: "Please provide timeline name and description first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[GenerateEvents] Starting generation:', { 
        timelineName, 
        descriptionLength: timelineDescription?.length,
        isFactual,
        maxEvents,
        isNumbered,
        numberLabel
      });
      
      // Validate request body
      const requestBody = {
        timelineDescription: String(timelineDescription || '').trim(),
        timelineName: String(timelineName || '').trim(),
        maxEvents: Math.max(1, Math.min(100, parseInt(String(maxEvents || 20), 10) || 20)),
        isFactual: Boolean(isFactual),
        isNumbered: Boolean(isNumbered),
        numberLabel: String(numberLabel || 'Day').trim(),
        sourceRestrictions: sourceRestrictions.length > 0 ? sourceRestrictions : undefined,
      };

      // Additional validation
      if (!requestBody.timelineDescription || !requestBody.timelineName) {
        throw new Error("Timeline name and description are required");
      }

      console.log('[GenerateEvents] Request body:', requestBody);
      
      // Create AbortController for timeout handling (important for mobile networks)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (2 minutes) for longer timelines
      
      let response;
      try {
        response = await fetch("/api/ai/generate-events", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
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
        console.error('[GenerateEvents] API error:', { 
          status: response.status, 
          statusText: response.statusText,
          data, 
          errorMsg,
          requestBody 
        });
        
        // Special handling for 422 (Unprocessable Entity) - validation errors
        if (response.status === 422) {
          const validationError = data?.errors || data?.validation || errorMsg;
          throw new Error(`Validation error: ${validationError}. Please check that timeline name and description are provided.`);
        }
        
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

      const generatedEvents: TimelineEvent[] = data.events.map((e: any, idx: number) => {
        if (isNumbered) {
          // For numbered events, use number instead of year
          return {
            id: `event-${Date.now()}-${idx}`,
            number: e.number || (idx + 1), // Use provided number or sequential
            numberLabel: numberLabel,
            title: e.title,
          };
        } else {
          // For dated events, use year/month/day
          return {
            id: `event-${Date.now()}-${idx}`,
            year: e.year,
            month: e.month,
            day: e.day,
            title: e.title,
          };
        }
      });

      setEvents(generatedEvents);
      if (setImageReferences && Array.isArray(data.imageReferences)) {
        setImageReferences(
          data.imageReferences
            .filter((r: any) => r && r.url)
            .map((r: any) => ({ name: String(r.name || ''), url: String(r.url) }))
        );
      }
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
    const newEvent: TimelineEvent = isNumbered
      ? {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          number: events.length + 1, // Sequential numbering
          numberLabel: numberLabel,
          title: "",
        }
      : {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          year: new Date().getFullYear(),
          title: "",
        };
    
    console.log('[AddEvent] Adding new event:', newEvent);
    const updatedEvents = [...events, newEvent];
    console.log('[AddEvent] Updated events array length:', updatedEvents.length);
    setEvents(updatedEvents);
    
    // Show feedback
    toast({
      title: "Event added",
      description: "You can now enter the event details below.",
    });
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof TimelineEvent, value: any) => {
    const updatedEvents = events.map((e) => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        console.log('[UpdateEvent] Updating event:', { id, field, value, updated });
        return updated;
      }
      return e;
    });
    console.log('[UpdateEvent] Updated events count:', updatedEvents.length);
    setEvents(updatedEvents);
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
        {writingStyle && (
          <p className="text-sm text-muted-foreground mb-3">
            Selected: <strong>{writingStyle}</strong>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {writingStyles.map((style) => (
            <Button
              key={style}
              type="button"
              variant={writingStyle === style ? "default" : "outline"}
              className="px-4 py-2 text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[WritingStyleStep] Button clicked:', style);
                setWritingStyle(style);
              }}
            >
              {style}
            </Button>
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
          </Button>
          <Button variant="outline" onClick={addEvent} className="w-full sm:w-auto sm:flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </div>
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
                {isNumbered ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={numberLabel}
                      type="number"
                      value={event.number || ""}
                      onChange={(e) =>
                        updateEvent(event.id, "number", parseInt(e.target.value))
                      }
                      className="w-32 h-10"
                    />
                    <span className="text-sm text-muted-foreground">
                      {numberLabel} {event.number || ""}
                    </span>
                  </div>
                ) : (
                  <Input
                    placeholder="Year"
                    type="number"
                    value={event.year || ""}
                    onChange={(e) =>
                      updateEvent(event.id, "year", parseInt(e.target.value))
                    }
                    className="w-32 h-10"
                  />
                )}
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

