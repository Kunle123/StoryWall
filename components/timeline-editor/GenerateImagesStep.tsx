import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Pencil, Loader2, Coins } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/use-credits";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";

const themeColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
];

interface GenerateImagesStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  imageStyle: string;
  themeColor: string;
}

const CREDIT_COST_IMAGE = 5;

export const GenerateImagesStep = ({
  events,
  setEvents,
  imageStyle,
  themeColor,
}: GenerateImagesStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const { deductCredits, credits } = useCredits();

  const handleSaveEdit = () => {
    if (editingEvent) {
      setEvents(
        events.map((e) => (e.id === editingEvent.id ? editingEvent : e))
      );
      setEditingEvent(null);
      toast({
        title: "Event updated",
        description: "Event details have been saved",
      });
    }
  };

  const handleGenerateImages = async () => {
    const eventCount = events.length;
    const totalCost = eventCount * CREDIT_COST_IMAGE;
    
    // Deduct credits before generating
    const creditsDeducted = await deductCredits(
      totalCost, 
      `AI Image Generation for ${eventCount} events`
    );
    if (!creditsDeducted) {
      setShowCreditsDialog(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    try {
      const response = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map(e => ({ title: e.title, description: e.description || "" })),
          imageStyle,
          themeColor,
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

      if (!data.images || data.images.length === 0) {
        throw new Error("No images were generated");
      }
      
      // Update events with images immediately (filter out null values)
      const successfulImages = data.images.filter((img: any) => img !== null);
      const failedCount = data.images.length - successfulImages.length;
      
      setEvents(
        events.map((e, idx) => ({
          ...e,
          imageUrl: data.images[idx] || e.imageUrl,
        }))
      );
      
      // Show warning if some images failed
      if (failedCount > 0) {
        toast({
          title: "Partial success",
          description: `Generated ${successfulImages.length} of ${events.length} images. Some prompts may have been rejected by content policy.`,
          variant: "default",
        });
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            toast({
              title: "Success!",
              description: `Generated ${data.images.length} images`,
            });
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    } catch (error: any) {
      setIsGenerating(false);
      setProgress(0);
      console.error("Error generating images:", error);
      toast({
        title: "Failed to generate images",
        description: error.message || "Please check your OpenAI API key configuration and try again.",
        variant: "destructive",
      });
    }
  };

  const allGenerated = events.every((e) => e.imageUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 5: Generate Images
        </h2>
        <p className="text-muted-foreground mb-6">
          Generate AI images for your timeline events using {imageStyle} style
          {themeColor && ` with ${themeColors.find(c => c.value === themeColor)?.name || 'selected'} theme`}
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleGenerateImages}
          disabled={allGenerated || isGenerating || events.length === 0}
          size="lg"
          className="w-full"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isGenerating ? "Generating Images..." : "Generate All Images"}
          {!isGenerating && events.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              <Coins className="w-3 h-3 mr-1" />
              {events.length * CREDIT_COST_IMAGE}
            </Badge>
          )}
        </Button>

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Generating {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Preview Generated Images */}
      {allGenerated && (
        <div className="space-y-4">
          <Label className="text-base">Generated Images</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="space-y-2 p-4 border rounded-lg bg-card"
              >
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground">No image</span>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold">{event.title}</Label>
                  <p className="text-xs text-muted-foreground">
                    {event.year}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEditingEvent(event)}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" size="lg" className="flex-1">
              <Eye className="mr-2 h-5 w-5" />
              Preview Timeline
            </Button>
            <Button variant="default" size="lg" className="flex-1">
              Save Timeline
            </Button>
          </div>
        </div>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={editingEvent.year}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, year: parseInt(e.target.value) || 0 })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, title: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingEvent.description || ""}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      description: e.target.value,
                    })
                  }
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        required={events.length * CREDIT_COST_IMAGE}
        current={credits}
        action={`AI Image Generation for ${events.length} events`}
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
        onContinueWithout={() => {
          toast({
            title: "Continue Without AI",
            description: "You can skip image generation and save your timeline. Images can be added later.",
          });
        }}
      />
    </div>
  );
};

