import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, Pencil } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

      if (!response.ok) {
        throw new Error("Failed to generate images");
      }

      const data = await response.json();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            setEvents(
              events.map((e, idx) => ({
                ...e,
                imageUrl: data.images[idx] || e.imageUrl,
              }))
            );
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate images. Please try again.",
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
          disabled={isGenerating}
          size="lg"
          className="w-full"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isGenerating ? "Generating Images..." : "Generate All Images"}
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
    </div>
  );
};

