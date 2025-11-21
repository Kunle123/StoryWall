import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Pencil, Loader2, Coins, AlertTriangle, Upload, RotateCw, Pipette } from "lucide-react";
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
import { updateEvent } from "@/lib/api/client";

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

interface GenerateImagesStepProps {
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[] | ((prev: TimelineEvent[]) => TimelineEvent[])) => void;
  imageStyle: string;
  setImageStyle?: (style: string) => void;
  themeColor: string;
  setThemeColor?: (color: string) => void;
  imageReferences?: Array<{ name: string; url: string }>;
  referencePhoto?: {
    file: File | null;
    url: string | null;
    personName: string;
    hasPermission: boolean;
  };
  includesPeople?: boolean;
  timelineId?: string; // Optional: if timeline already exists, save images immediately
  hasSelectedImageStyle?: boolean; // True if user has selected image style in step 4
}

const CREDIT_COST_PER_IMAGE = 1; // 1 credit per image

export const GenerateImagesStep = ({
  events,
  setEvents,
  imageStyle,
  setImageStyle,
  themeColor,
  setThemeColor,
  imageReferences = [],
  referencePhoto,
  includesPeople = true,
  timelineId,
  hasSelectedImageStyle = false,
}: GenerateImagesStepProps) => {
  const [customStyle, setCustomStyle] = useState("");
  const [customColor, setCustomColor] = useState(themeColor || "#3B82F6");
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(events.map(e => e.id)));
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [totalRegenerations, setTotalRegenerations] = useState(0); // Cumulative regenerations across all images
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const { deductCredits, credits, fetchCredits } = useCredits();

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

  const handleRegenerateImage = async (eventId: string) => {
    // Cumulative regenerations: first 10 are FREE across all images, then charge 10 credits each
    const isFree = totalRegenerations < 10;
    const cost = isFree ? 0 : 10;
    
    // Check credits only if not free
    if (!isFree && credits < cost) {
      setShowCreditsDialog(true);
      return;
    }

    setRegeneratingId(eventId);
    
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const response = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{ 
            title: event.title, 
            description: event.description || "",
            year: event.year,
            imagePrompt: event.imagePrompt,
          }],
          imageStyle,
          themeColor,
          imageReferences,
          includesPeople,
          referencePhoto: referencePhoto && referencePhoto.url && referencePhoto.personName && referencePhoto.hasPermission
            ? {
                url: referencePhoto.url,
                personName: referencePhoto.personName,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Regeneration failed');
      }

      const data = await response.json();
      
      if (!data.images || data.images.length === 0 || !data.images[0]) {
        throw new Error("No image was generated");
      }

      // Update the event with the new image
      setEvents(
        events.map((e) =>
          e.id === eventId ? { ...e, imageUrl: data.images[0] } : e
        )
      );

      // Deduct credits AFTER successful generation (only if not free)
      if (!isFree) {
        await deductCredits(cost, `Image Regeneration for "${event.title}"`);
      }
      
      // Update total regeneration count (cumulative across all images)
      setTotalRegenerations(prev => prev + 1);

      toast({
        title: "Image regenerated",
        description: isFree 
          ? `New image generated for "${event.title}" (${10 - totalRegenerations - 1} free regenerations remaining)`
          : `New image generated for "${event.title}" (10 credits used)`,
      });
    } catch (error: any) {
      console.error("Error regenerating image:", error);
      toast({
        title: "Failed to regenerate image",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleGenerateImages = async () => {
    const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
    const eventCount = selectedEventsList.length;
    
    // Calculate cost: 1 credit per image
    const totalCost = eventCount * CREDIT_COST_PER_IMAGE;
    
    // Check credits but don't deduct yet - will deduct after successful generation
    if (credits < totalCost) {
      setShowCreditsDialog(true);
      return;
    }

    setIsGenerating(true);
    setHasStartedGeneration(true); // Hide the selection card once generation starts
    setProgress(0);
    setTotalEvents(eventCount);
    setGeneratingCount(0);
    
    try {
      // Use streaming API for progressive loading
      const response = await fetch("/api/ai/generate-images?stream=true", {
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
          includesPeople,
          referencePhoto: referencePhoto && referencePhoto.url && referencePhoto.personName && referencePhoto.hasPermission
            ? {
                url: referencePhoto.url,
                personName: referencePhoto.personName,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("Streaming not supported");
      }

      // Create a map of event IDs to their index in selectedEventsList for quick lookup
      const eventIdToIndex = new Map<string, number>();
      selectedEventsList.forEach((e, idx) => {
        eventIdToIndex.set(e.id, idx);
      });
      
      let finalData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'image') {
                // Update progress based on completed images
                setGeneratingCount(data.completed);
                setProgress((data.completed / data.total) * 100);
                
                // Update event with image as soon as it's ready
                // data.index is the index in the selectedEventsList array
                if (data.imageUrl && data.index < selectedEventsList.length) {
                  const event = selectedEventsList[data.index];
                  setEvents(prevEvents => {
                    const updated = prevEvents.map(e => 
                      e.id === event.id ? { ...e, imageUrl: data.imageUrl } : e
                    );
                    
                    // If timeline exists, save image to database immediately
                    if (timelineId && event.id) {
                      updateEvent(event.id, { 
                        image_url: data.imageUrl,
                        image_prompt: data.prompt || undefined, // Save the prompt used
                      }).catch(error => {
                        console.error(`[GenerateImages] Failed to save image for event ${event.id}:`, error);
                      });
                    }
                    
                    return updated;
                  });
                }
              } else if (data.type === 'complete') {
                // All images complete
                finalData = data;
                setProgress(100);
                setGeneratingCount(eventCount);
                
                // Credits are deducted server-side - refresh balance
                if (data.creditsDeducted !== undefined) {
                  console.log(`[GenerateImages] Server deducted ${data.creditsDeducted} credits (streaming)`);
                  await fetchCredits();
                }
                
                // Ensure all events are updated (in case any were missed)
                // data.images array corresponds to selectedEventsList order
                setEvents(prevEvents => {
                  const updatedEvents = prevEvents.map(e => {
                    const selectedIndex = eventIdToIndex.get(e.id);
                    if (selectedIndex !== undefined && data.images[selectedIndex]) {
                      return { ...e, imageUrl: data.images[selectedIndex] };
                    }
                    return e;
                  });
                  
                  // If timeline exists, save images to database immediately
                  if (timelineId) {
                    updatedEvents.forEach(async (e) => {
                      const selectedIndex = eventIdToIndex.get(e.id);
                      if (selectedIndex !== undefined && data.images[selectedIndex] && e.id) {
                        try {
                          await updateEvent(e.id, { 
                            image_url: data.images[selectedIndex],
                            image_prompt: data.prompts?.[selectedIndex] || undefined, // Save the prompt used
                          });
                          console.log(`[GenerateImages] Saved image to database for event ${e.id}`);
                        } catch (error) {
                          console.error(`[GenerateImages] Failed to save image for event ${e.id}:`, error);
                        }
                      }
                    });
                  }
                  
                  return updatedEvents;
                });
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error');
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line, parseError);
            }
          }
        }
      }

      if (!finalData || !finalData.images || finalData.images.length === 0) {
        throw new Error("No images were generated");
      }
      
      const successfulImages = finalData.images.filter((img: any) => img !== null);
      const failedCount = finalData.images.length - successfulImages.length;
      
      // Credits are now deducted server-side by the API
      // Only refresh credits balance to reflect server-side deduction
      if (finalData.creditsDeducted !== undefined) {
        console.log(`[GenerateImages] Server deducted ${finalData.creditsDeducted} credits`);
        // Refresh credits to get updated balance from server
        await fetchCredits();
      } else {
        // Fallback: if server didn't deduct (old API version), deduct client-side
        console.warn('[GenerateImages] Server did not deduct credits, using client-side fallback');
        const creditsDeducted = await deductCredits(
          totalCost, 
          `AI Image Generation for ${eventCount} events`
        );
        if (!creditsDeducted) {
          console.warn('Failed to deduct credits after image generation');
        }
      }
      
      setIsGenerating(false);
      
      // Retry failed images automatically
      if (failedCount > 0) {
        // Find events that failed (have null images)
        // Map images back to events by index
        const failedEvents: TimelineEvent[] = [];
        selectedEventsList.forEach((e, idx) => {
          if (!finalData.images[idx]) {
            failedEvents.push(e);
          }
        });
        
        if (failedEvents.length > 0) {
          console.log(`[GenerateImages] Retrying ${failedEvents.length} failed images...`);
          toast({
            title: "Retrying failed images",
            description: `Generated ${successfulImages.length} of ${eventCount} images. Retrying ${failedEvents.length} failed images...`,
            variant: "default",
          });
          
          // Retry failed images (max 2 retries)
          let retryAttempt = 0;
          const maxRetries = 2;
          let remainingFailedEvents = [...failedEvents];
          
          // Get current events state for retry tracking
          let currentEvents: TimelineEvent[] = [];
          setEvents(prev => {
            currentEvents = [...prev];
            return prev;
          });
          
          while (remainingFailedEvents.length > 0 && retryAttempt < maxRetries) {
            retryAttempt++;
            console.log(`[GenerateImages] Retry attempt ${retryAttempt}/${maxRetries} for ${remainingFailedEvents.length} events`);
            
            // Update progress for retry - show progress based on successful images
            const successfulCount = eventCount - remainingFailedEvents.length;
            setGeneratingCount(successfulCount);
            // Progress should be between 90-95% during retries
            const retryProgress = 90 + (successfulCount / eventCount) * 5;
            setProgress(Math.min(95, retryProgress));
            
            try {
              const retryResponse = await fetch("/api/ai/generate-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  events: remainingFailedEvents.map(e => ({ 
                    title: e.title, 
                    description: e.description || "",
                    year: e.year,
                    imagePrompt: e.imagePrompt,
                  })),
                  imageStyle,
                  themeColor,
                  imageReferences,
                  referencePhoto: referencePhoto && referencePhoto.url && referencePhoto.personName && referencePhoto.hasPermission
                    ? {
                        url: referencePhoto.url,
                        personName: referencePhoto.personName,
                      }
                    : undefined,
                }),
              });

              const retryData = await retryResponse.json();

              if (!retryResponse.ok) {
                throw new Error(retryData?.error || 'Retry failed');
              }

              if (!retryData.images || retryData.images.length === 0) {
                break; // Stop retrying if no images returned
              }

              // Update events with retried images
              let retryImageIndex = 0;
              const stillFailed: TimelineEvent[] = [];
              
              // Update currentEvents with retried images
              currentEvents = currentEvents.map((e) => {
                const isFailed = remainingFailedEvents.some(fe => fe.id === e.id);
                if (isFailed) {
                  const retryImageUrl = retryData.images[retryImageIndex];
                  retryImageIndex++;
                  
                  if (retryImageUrl) {
                    return { ...e, imageUrl: retryImageUrl };
                  } else {
                    stillFailed.push(e);
                    return e;
                  }
                }
                return e;
              });
              
              setEvents(currentEvents);
              remainingFailedEvents = stillFailed;
              
              if (stillFailed.length === 0) {
                console.log(`[GenerateImages] All images successfully generated after retry ${retryAttempt}`);
                break;
              }
              
              // Wait a bit before next retry
              if (retryAttempt < maxRetries && stillFailed.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } catch (retryError: any) {
              console.error(`[GenerateImages] Retry attempt ${retryAttempt} failed:`, retryError);
              // Continue to next retry attempt
            }
          }
          
          // Final update
          setProgress(100);
          setGeneratingCount(eventCount);
          
          const finalSuccessful = eventCount - remainingFailedEvents.length;
          
          if (remainingFailedEvents.length > 0) {
            toast({
              title: "Partial success",
              description: `Generated ${finalSuccessful} of ${eventCount} images. ${remainingFailedEvents.length} images could not be generated after ${maxRetries} retries.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Success!",
              description: `Generated all ${finalSuccessful} images (${retryAttempt > 0 ? `after ${retryAttempt} retry${retryAttempt > 1 ? 'ies' : ''}` : ''})`,
            });
          }
        } else {
          toast({
            title: "Success!",
            description: `Generated ${successfulImages.length} images`,
          });
        }
      } else {
        toast({
          title: "Success!",
          description: `Generated ${successfulImages.length} images`,
        });
      }
    } catch (error: any) {
      setIsGenerating(false);
      setProgress(0);
      setGeneratingCount(0);
      console.error("Error generating images:", error);
      toast({
        title: "Failed to generate images",
        description: error.message || "Please check your OpenAI API key configuration and try again.",
        variant: "destructive",
      });
      // No credits deducted if generation failed
    }
  };

  // Detect events with famous people (for internal tracking, not UI restrictions)
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
      </div>

      <Tabs defaultValue="ai" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Generated</TabsTrigger>
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
        </TabsList>

        {/* Generate Images button - appears beneath tabs for AI Generated */}
        {activeTab === "ai" && !hasStartedGeneration && (
          <div className="mt-4">
            <Button
              onClick={handleGenerateImages}
              disabled={isGenerating || selectedEvents.size === 0 || !imageStyle || events.some(e => e.imageUrl)}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating... {generatingCount > 0 && totalEvents > 0 ? `${generatingCount} of ${totalEvents} events` : `${Math.round(progress)}%`}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Images ({selectedEvents.size * CREDIT_COST_PER_IMAGE} credit{selectedEvents.size !== 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        )}

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
          {/* Only show Image Style & Theme card if not already selected in step 4 (user can go back to step 4 to change) */}
          {!hasSelectedImageStyle && !hasStartedGeneration && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">Image Style</Label>
                <div className="flex flex-wrap gap-2">
                  {["Photorealistic", "Illustration", "Minimalist", "Vintage", "Watercolor", "3D Render", "Sketch", "Abstract"].map((style) => (
                    <Badge
                      key={style}
                      variant={imageStyle === style ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => setImageStyle?.(style)}
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
                      onClick={() => setThemeColor?.(color.value)}
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
                        setThemeColor?.(e.target.value);
                      }}
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setThemeColor?.(customColor)}
                    className="h-10"
                  >
                    <Pipette className="mr-2 h-4 w-4" />
                    Apply Color
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          )}

          {!hasStartedGeneration && (
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
                Total cost: {selectedEvents.size * CREDIT_COST_PER_IMAGE} credit{selectedEvents.size !== 1 ? 's' : ''} ({selectedEvents.size} image{selectedEvents.size !== 1 ? 's' : ''})
              </p>
            </div>

              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {generatingCount > 0 && totalEvents > 0 
                      ? `Generating image ${generatingCount} of ${totalEvents} (${Math.round(progress)}%)`
                      : `Generating... ${Math.round(progress)}%`}
                  </p>
                </div>
              )}
            </Card>
          )}

          {(hasStartedGeneration || events.some(e => e.imageUrl)) && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Generated Images</h3>
              {isGenerating && events.filter(e => e.imageUrl).length === 0 ? (
                // Show spinner while waiting for first images
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Generating images...</p>
                    <p className="text-xs text-muted-foreground">
                      {generatingCount > 0 && totalEvents > 0 
                        ? `Processing ${generatingCount} of ${totalEvents} events (${Math.round(progress)}%)`
                        : `This may take a few moments...`}
                    </p>
                    {progress > 0 && (
                      <Progress value={progress} className="w-64 mt-4" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Contact Sheet: 4 images per row */}
                  <div className="grid grid-cols-4 gap-4">
                    {events.filter(e => e.imageUrl).map((event) => (
                      <div key={event.id} className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative aspect-square">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay with event info on hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                              {event.year} - {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-xs text-white/90 line-clamp-2 mb-2">{event.description}</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingEvent(event)}
                                className="flex-1 text-xs h-7"
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRegenerateImage(event.id)}
                                disabled={regeneratingId === event.id}
                                className="flex-1 text-xs h-7"
                              >
                                {regeneratingId === event.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <RotateCw className="w-3 h-3 mr-1" />
                                    {(() => {
                                      if (totalRegenerations < 10) {
                                        return `${10 - totalRegenerations} free`;
                                      }
                                      return "10 credits";
                                    })()}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        {/* Always visible title below image */}
                        <div className="p-2 bg-background">
                          <p className="text-xs font-medium line-clamp-1">
                            {event.year} - {event.title}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Placeholder slots for images still generating */}
                    {isGenerating && Array.from({ length: Math.max(0, totalEvents - events.filter(e => e.imageUrl).length) }).map((_, idx) => (
                      <div key={`placeholder-${idx}`} className="border rounded-lg overflow-hidden aspect-square bg-muted/50 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">Generating...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isGenerating && events.filter(e => e.imageUrl).length > 0 && (
                    // Show progress indicator when some images are already generated
                    <div className="flex items-center justify-center py-6 border-t">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          Generating remaining images... {generatingCount > 0 && totalEvents > 0 
                            ? `${generatingCount} of ${totalEvents} complete (${Math.round(progress)}%)`
                            : `${Math.round(progress)}%`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
        required={events.filter(e => selectedEvents.has(e.id)).length * CREDIT_COST_PER_IMAGE}
        current={credits}
        action={`AI Image Generation`}
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

