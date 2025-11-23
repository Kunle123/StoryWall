import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Coins } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TermsViolationDialog } from "./TermsViolationDialog";
import { VerificationDialog } from "./VerificationDialog";

interface EventDetailsStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  timelineDescription: string;
  timelineName?: string; // Added for newsworthiness test
  writingStyle: string;
  imageStyle?: string; // Optional - if provided, generate image prompts too
  themeColor?: string; // Optional - if provided, include in image prompts
  sourceRestrictions?: string[];
  timelineType?: string; // 'social' or 'statistics' or undefined
  hashtags?: string[];
  setHashtags?: (hashtags: string[]) => void;
}

export const EventDetailsStep = ({ events, setEvents, timelineDescription, timelineName, writingStyle, imageStyle, themeColor, sourceRestrictions = [], timelineType, hashtags = [], setHashtags }: EventDetailsStepProps) => {
  const { toast } = useToast();
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedEventIds, setGeneratedEventIds] = useState<Set<string>>(new Set());
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [violationRecommendation, setViolationRecommendation] = useState<string | undefined>();
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any>(null);

  const updateEventDescription = (id: string, description: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  const updateEventImagePrompt = (id: string, imagePrompt: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, imagePrompt } : e))
    );
  };

  const generateDescription = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    // No credit charge for description generation
    setGeneratingId(id);
    try {
      const response = await fetch("/api/ai/generate-descriptions-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          events: [{ year: event.year, title: event.title }],
          timelineDescription,
          timelineTitle: timelineName, // Pass timeline title for newsworthiness test
          writingStyle,
          imageStyle: imageStyle || 'Illustration', // Always include for image prompt generation
          themeColor, // Include if available
          sourceRestrictions: sourceRestrictions.length > 0 ? sourceRestrictions : undefined,
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
        
        // Check if this is a newsworthiness violation
        if (data?.newsworthinessViolation) {
          setViolationRecommendation(data.newsworthinessViolation.recommendation);
          setShowViolationDialog(true);
          return; // Don't throw error, just show dialog
        }
        
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

    // No credit charge for description generation
    setIsGeneratingAll(true);
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (2 minutes)
      
      let response;
      try {
        response = await fetch("/api/ai/generate-descriptions-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: events.map(e => ({ year: e.year, title: e.title })),
            timelineDescription,
            timelineTitle: timelineName, // Pass timeline title for newsworthiness test
            writingStyle,
            imageStyle: imageStyle || 'Illustration', // Always include for image prompt generation
            themeColor, // Include if available
            sourceRestrictions: sourceRestrictions.length > 0 ? sourceRestrictions : undefined,
            timelineType, // Pass timeline type for social media prompts
            verifyAndCorrect: true, // Enable verification and auto-correction
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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.details || `HTTP ${response.status}: ${response.statusText}`;
        
        // Check if this is a newsworthiness violation
        if (data?.newsworthinessViolation) {
          setViolationRecommendation(data.newsworthinessViolation.recommendation);
          setShowViolationDialog(true);
          setIsGeneratingAll(false);
          return; // Don't throw error, just show dialog
        }
        
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
      
      // Extract and save hashtags if provided by AI
      if (data.hashtags && Array.isArray(data.hashtags) && data.hashtags.length > 0 && setHashtags) {
        setHashtags(data.hashtags);
      }
      
      // Handle verification results
      // Auto-correction happens silently in the background - no dialog needed
      // Corrected descriptions are automatically applied to events above
      if (data.verificationSummary) {
        const { corrected, total } = data.verificationSummary;
        
        // Show success toast (auto-correction happens silently, no need to show details)
        toast({
          title: "Success!",
          description: `Generated descriptions for ${events.length} events${data.hashtags ? ` with ${data.hashtags.length} hashtags` : ''}`,
        });
      } else {
        toast({
          title: "Success!",
          description: `Generated descriptions for ${events.length} events${data.hashtags ? ` with ${data.hashtags.length} hashtags` : ''}`,
        });
      }
      
      // Mark all events as generated
      setGeneratedEventIds(new Set(events.map(e => e.id)));
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
        <div className="flex gap-2">
          <Button
            onClick={generateAllDescriptions}
            disabled={isGeneratingAll || events.length === 0 || generatedEventIds.size === events.length}
            size="lg"
            className="flex-1"
          >
            {isGeneratingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isGeneratingAll ? "Generating & Verifying..." : "Generate Descriptions with AI"}
          </Button>
        </div>
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
            {/* Hidden image prompt field - used for image generation but not visible to user */}
            <Textarea
              placeholder="Image prompt (auto-generated, used for image creation)..."
              value={event.imagePrompt || ""}
              onChange={(e) => updateEventImagePrompt(event.id, e.target.value)}
              rows={2}
              className="resize-none hidden"
              aria-hidden="true"
              style={{ display: 'none' }}
            />
          </div>
        ))}
      </div>

            {/* Verification Dialog */}
            {verificationResults && (
              <VerificationDialog
                open={showVerificationDialog}
                onOpenChange={setShowVerificationDialog}
                verifiedEvents={verificationResults.verifiedEvents}
                summary={verificationResults.summary}
                timelineDescription={timelineDescription}
                timelineName={timelineName || "Untitled Timeline"}
                onEventCorrected={(eventIndex, correctedEvent) => {
                  // Update the event in the events array
                  const updatedEvents = [...events];
                  const eventId = updatedEvents[eventIndex]?.id;
                  if (eventId) {
                    updatedEvents[eventIndex] = {
                      ...updatedEvents[eventIndex],
                      description: correctedEvent.description || updatedEvents[eventIndex].description,
                      title: correctedEvent.title || updatedEvents[eventIndex].title,
                    };
                    setEvents(updatedEvents);
                  }
                  
                  // Update verification results
                  const updatedVerificationResults = { ...verificationResults };
                  updatedVerificationResults.verifiedEvents[eventIndex] = {
                    ...updatedVerificationResults.verifiedEvents[eventIndex],
                    ...correctedEvent,
                    corrected: true,
                    confidence: 'high' as const,
                    issues: [],
                  };
                  setVerificationResults(updatedVerificationResults);
                }}
              />
            )}

      {/* Terms Violation Dialog */}
      <TermsViolationDialog
        open={showViolationDialog}
        onOpenChange={setShowViolationDialog}
        recommendation={violationRecommendation}
      />
    </div>
  );
};

