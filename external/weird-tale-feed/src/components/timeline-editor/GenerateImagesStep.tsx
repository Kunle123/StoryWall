import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Pencil, Loader2, RefreshCw } from "lucide-react";
import { TimelineEvent } from "@/pages/TimelineEditor";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCredits } from "@/hooks/use-credits";

interface GenerateImagesStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  imageStyle: string;
  themeColor: string;
  isManual?: boolean;
}

export const GenerateImagesStep = ({
  events,
  setEvents,
  imageStyle,
  themeColor,
  isManual = false,
}: GenerateImagesStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState<Record<string, number>>({});
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(events.map(e => e.id)));
  const { deductCredits } = useCredits();

  const handleSaveEdit = () => {
    if (editingEvent) {
      setEvents(
        events.map((e) => (e.id === editingEvent.id ? editingEvent : e))
      );
      setEditingEvent(null);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const getTotalCost = () => {
    return selectedEvents.size * 10;
  };

  const handleGenerateImages = () => {
    if (!isManual) {
      const cost = getTotalCost();
      if (!deductCredits(cost, `AI Image Generation for ${selectedEvents.size} events`)) {
        return;
      }
    }
    
    setIsGenerating(true);
    setProgress(0);
    
    // Mock generation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          // Mock image URLs - only for selected events
          setEvents(
            events.map((e) => ({
              ...e,
              imageUrl: selectedEvents.has(e.id) ? "/placeholder.svg" : e.imageUrl,
            }))
          );
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleRegenerateImage = async (eventId: string) => {
    const currentCount = regenerationCount[eventId] || 0;
    const totalRegenerated = Object.values(regenerationCount).reduce((a, b) => a + b, 0);
    
    // First 3 regenerations across all images are free
    if (totalRegenerated >= 3) {
      if (!deductCredits(10, "Image Regeneration")) {
        return;
      }
    }
    
    setRegeneratingId(eventId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update image with new mock URL
    setEvents(
      events.map((e) =>
        e.id === eventId ? { ...e, imageUrl: `/placeholder.svg?v=${Date.now()}` } : e
      )
    );
    
    setRegenerationCount(prev => ({ ...prev, [eventId]: currentCount + 1 }));
    setRegeneratingId(null);
  };

  const getTotalRegenerations = () => {
    return Object.values(regenerationCount).reduce((a, b) => a + b, 0);
  };

  const allGenerated = events.every((e) => e.imageUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          {isManual ? "Preview & Save Timeline" : "Step 5: Generate Images"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isManual 
            ? "Review your timeline and save it when ready"
            : `Generate AI images for your timeline events using ${imageStyle} style${themeColor ? ` with ${themeColor} theme` : ""}`
          }
        </p>
      </div>

      {!isManual && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-card">
            <Label className="text-base font-semibold mb-3 block">Select Events to Generate Images</Label>
            <p className="text-sm text-muted-foreground mb-4">Choose which events you want to generate AI images for (10 credits per image)</p>
            <div className="space-y-2">
              {events.map((event) => (
                <label key={event.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.id)}
                    onChange={() => toggleEventSelection(event.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="flex-1 text-sm">{event.title} ({event.year})</span>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold">Total Cost: {getTotalCost()} credits</p>
            </div>
          </div>
          
          <Button
            onClick={handleGenerateImages}
            disabled={selectedEvents.size === 0 || isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isGenerating ? "Generating Images..." : `Generate ${selectedEvents.size} Image${selectedEvents.size !== 1 ? 's' : ''}`}
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
      )}

      {/* Preview Generated Images or Manual Timeline */}
      {(allGenerated || isManual) && (
        <div className="space-y-4">
          {!isManual && (
            <div className="flex items-center justify-between">
              <Label className="text-base">Generated Images</Label>
              <p className="text-sm text-muted-foreground">
                {getTotalRegenerations() < 3 
                  ? `${3 - getTotalRegenerations()} free regenerations remaining`
                  : "10 credits per regeneration"
                }
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="space-y-2 p-4 border rounded-lg bg-card"
              >
                {!isManual && (
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
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
                )}
                <div>
                  <Label className="text-sm font-semibold">{event.title}</Label>
                  <p className="text-xs text-muted-foreground">
                    {event.year}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingEvent(event)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  {!isManual && event.imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRegenerateImage(event.id)}
                      disabled={regeneratingId === event.id}
                    >
                      {regeneratingId === event.id ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-3 w-3" />
                      )}
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="default" size="lg" className="w-full sm:w-auto">
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
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, title: e.target.value })
                  }
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
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
