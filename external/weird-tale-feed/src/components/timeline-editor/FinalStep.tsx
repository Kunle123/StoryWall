import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, RotateCw, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pipette } from "lucide-react";
import { TimelineEvent } from "@/pages/TimelineEditor";
import { useCredits } from "@/hooks/use-credits";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface FinalStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  imageStyle: string;
  setImageStyle: (style: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const imageStyles = [
  "Photorealistic",
  "Illustration",
  "Minimalist",
  "Vintage",
  "Watercolor",
  "3D Render",
  "Sketch",
  "Abstract",
];

const themeColors = [
  { name: "None", value: "" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
];

export const FinalStep = ({
  events,
  setEvents,
  imageStyle,
  setImageStyle,
  themeColor,
  setThemeColor,
}: FinalStepProps) => {
  const [customStyle, setCustomStyle] = useState("");
  const [customColor, setCustomColor] = useState("#3B82F6");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(events.map(e => e.id)));
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState<Record<string, number>>({});
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const { deductCredits } = useCredits();

  const handleFileUpload = (eventId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, imageUrl } : event
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
  };

  const getTotalCost = () => {
    return selectedEvents.size * 5;
  };

  const handleGenerateImages = async () => {
    const cost = getTotalCost();
    const success = deductCredits(cost, "AI image generation");
    
    if (!success) return;

    setIsGenerating(true);
    setProgress(0);
    
    const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
    
    for (let i = 0; i < selectedEventsList.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const event = selectedEventsList[i];
      const imageUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.random() * 100000000000}?w=800&h=600&fit=crop`;
      
      setEvents(
        events.map(e =>
          e.id === event.id ? { ...e, imageUrl } : e
        )
      );
      
      setProgress(((i + 1) / selectedEventsList.length) * 100);
    }
    
    setIsGenerating(false);
  };

  const handleRegenerateImage = async (eventId: string) => {
    const count = regenerationCount[eventId] || 0;
    const cost = count >= 2 ? 10 : 5;
    
    const success = deductCredits(cost, "AI image regeneration");
    if (!success) return;

    setRegeneratingId(eventId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const imageUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.random() * 100000000000}?w=800&h=600&fit=crop`;
    
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, imageUrl } : e
    ));
    
    setRegenerationCount(prev => ({
      ...prev,
      [eventId]: count + 1
    }));
    
    setRegeneratingId(null);
  };

  const handleSaveEdit = () => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      setEditingEvent(null);
    }
  };

  const getTotalRegenerations = () => {
    return Object.values(regenerationCount).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 4: Images
        </h2>
        <p className="text-muted-foreground mb-6">
          Upload your own images or generate them with AI
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
          <TabsTrigger value="ai">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Upload images for each event in your timeline
            </p>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{event.year} - {event.title}</p>
                  </div>
                  {event.imageUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(event.id, file);
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Change
                          </span>
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(event.id, file);
                        }}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Image Style</Label>
                <div className="flex flex-wrap gap-2">
                  {imageStyles.map((style) => (
                    <Badge
                      key={style}
                      variant={imageStyle === style ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => setImageStyle(style)}
                    >
                      {style}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <Label className="text-sm mb-2 block">Or describe your own style</Label>
                  <Textarea
                    placeholder="e.g., in a comic book hero style"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base mb-3 block">Theme Color (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select a dominant color theme for the generated images
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {themeColors.map((color) => (
                    <Badge
                      key={color.name}
                      variant={themeColor === color.value ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => setThemeColor(color.value)}
                    >
                      {color.value && (
                        <div 
                          className="w-4 h-4 rounded-full mr-2 border border-border"
                          style={{ backgroundColor: color.value }}
                        />
                      )}
                      {color.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-sm mb-2 block">Custom Color</Label>
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setThemeColor(e.target.value);
                      }}
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setThemeColor(customColor)}
                    className="h-10"
                  >
                    <Pipette className="mr-2 h-4 w-4" />
                    Apply Color
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Select Events to Generate Images For</h3>
            <div className="space-y-2 mb-4">
              {events.map((event) => (
                <label key={event.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.id)}
                    onChange={() => toggleEventSelection(event.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{event.year} - {event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </label>
              ))}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm font-semibold">
                Total cost: {getTotalCost()} credits
              </p>
            </div>

            <Button
              onClick={handleGenerateImages}
              disabled={isGenerating || selectedEvents.size === 0 || !imageStyle}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating... {Math.round(progress)}%
                </>
              ) : (
                `Generate Images (${getTotalCost()} credits)`
              )}
            </Button>
          </Card>

          {events.some(e => e.imageUrl) && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Generated Images</h3>
              <div className="space-y-4">
                {events.filter(e => e.imageUrl).map((event) => (
                  <div key={event.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium">{event.year} - {event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateImage(event.id)}
                          disabled={regeneratingId === event.id}
                        >
                          {regeneratingId === event.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RotateCw className="w-4 h-4 mr-2" />
                              Regenerate {regenerationCount[event.id] >= 2 ? "(10 credits)" : "(5 credits)"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {getTotalRegenerations() > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Total regenerations used: {getTotalRegenerations()}
                </p>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={editingEvent.year}
                  onChange={(e) => setEditingEvent({ ...editingEvent, year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingEvent.description || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
