import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Pencil, Loader2, Coins, AlertTriangle, Upload, RotateCw } from "lucide-react";
import { TimelineEvent } from "./WritingStyleStep";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/use-credits";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";
import { containsFamousPerson } from "@/lib/utils/famousPeopleHandler";

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
  imageReferences?: Array<{ name: string; url: string }>;
}

const CREDIT_COST_IMAGE_BATCH = 10; // 10 credits for up to 20 images

export const GenerateImagesStep = ({
  events,
  setEvents,
  imageStyle,
  themeColor,
  imageReferences = [],
}: GenerateImagesStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(events.map(e => e.id)));
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

  const handleFileUpload = async (eventId: string, file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingEventId(eventId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      setEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, imageUrl: data.url } : event
        )
      );
      
      toast({
        title: "Image uploaded",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingEventId(null);
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

  const handleGenerateImages = async () => {
    const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
    const eventCount = selectedEventsList.length;
    const totalCost = CREDIT_COST_IMAGE_BATCH; // 10 credits for up to 20 images
    
    // Check credits but don't deduct yet - will deduct after successful generation
    if (credits < totalCost) {
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
          events: selectedEventsList.map(e => ({ 
            title: e.title, 
            description: e.description || "",
            year: e.year,
            imagePrompt: e.imagePrompt, // Include AI-generated prompts if available
          })),
          imageStyle,
          themeColor,
          imageReferences,
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
      
      // Map images back to selected events only
      let imageIndex = 0;
      setEvents(
        events.map((e) => {
          if (selectedEvents.has(e.id)) {
            const imageUrl = data.images[imageIndex] || e.imageUrl;
            imageIndex++;
            return { ...e, imageUrl };
          }
          return e;
        })
      );
      
      // Deduct credits AFTER successful generation
      const creditsDeducted = await deductCredits(
        totalCost, 
        `AI Image Generation for ${eventCount} events`
      );
      
      if (!creditsDeducted) {
        console.warn('Failed to deduct credits after image generation');
      }
      
      // Show warning if some images failed
      if (failedCount > 0) {
        toast({
          title: "Partial success",
          description: `Generated ${successfulImages.length} of ${eventCount} images. Some prompts may have been rejected by content policy.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success!",
          description: `Generated ${successfulImages.length} images`,
        });
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsGenerating(false);
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
      // No credits deducted if generation failed
    }
  };

  // Detect events with famous people
  const eventsWithFamousPeople = useMemo(() => {
    return events.filter(event => 
      containsFamousPerson(event.title) || 
      (event.description && containsFamousPerson(event.description)) ||
      (event.imagePrompt && containsFamousPerson(event.imagePrompt))
    );
  }, [events]);

  const hasFamousPeople = eventsWithFamousPeople.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 5: Images
        </h2>
        <p className="text-muted-foreground mb-6">
          Upload your own images or generate them with AI
        </p>
        {hasFamousPeople && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Famous People Detected
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  {eventsWithFamousPeople.length} event{eventsWithFamousPeople.length > 1 ? 's' : ''} mention{eventsWithFamousPeople.length > 1 ? '' : 's'} famous people. Images will use stylized artistic representations to avoid likeness issues.
                </p>
                {imageStyle === "Photorealistic" && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Note: Photorealistic style has been automatically switched to Illustration for these events.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
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
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {event.description}
                      </p>
                    )}
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
                          disabled={uploadingEventId === event.id}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          disabled={uploadingEventId === event.id}
                        >
                          <span>
                            {uploadingEventId === event.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
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
                        disabled={uploadingEventId === event.id}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        disabled={uploadingEventId === event.id}
                      >
                        <span>
                          {uploadingEventId === event.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
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
            <h3 className="font-semibold mb-4">Select Events to Generate Images For</h3>
            <div className="space-y-2 mb-4">
              {events.map((event) => (
                <label 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
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
                Total cost: {CREDIT_COST_IMAGE_BATCH} credits
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
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Images ({CREDIT_COST_IMAGE_BATCH} credits)
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Generating {Math.round(progress)}%
                </p>
              </div>
            )}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
        required={CREDIT_COST_IMAGE_BATCH}
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

