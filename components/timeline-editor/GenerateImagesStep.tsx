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
  setEvents: (events: TimelineEvent[]) => void;
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
}

const CREDIT_COST_IMAGE_BATCH = 10; // 10 credits for up to 20 images

export const GenerateImagesStep = ({
  events,
  setEvents,
  imageStyle,
  setImageStyle,
  themeColor,
  setThemeColor,
  imageReferences = [],
  referencePhoto,
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
  const [regenerationCount, setRegenerationCount] = useState<Record<string, number>>({});
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

  const handleRegenerateImage = async (eventId: string) => {
    const count = regenerationCount[eventId] || 0;
    
    // First 5 regenerations are FREE, then charge 10 credits
    const isFree = count < 5;
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
      
      // Update regeneration count
      setRegenerationCount(prev => ({
        ...prev,
        [eventId]: count + 1
      }));

      toast({
        title: "Image regenerated",
        description: isFree 
          ? `New image generated for "${event.title}" (${5 - count - 1} free regenerations remaining)`
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
    
    // Calculate cost: 10 credits for first 20 images, 0.5 credits per image over 20
    const baseCost = CREDIT_COST_IMAGE_BATCH; // 10 credits for up to 20 images
    const additionalImages = Math.max(0, eventCount - 20);
    const additionalCost = additionalImages * 0.5;
    const totalCost = baseCost + additionalCost;
    
    // Check credits but don't deduct yet - will deduct after successful generation
    if (credits < totalCost) {
      setShowCreditsDialog(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setTotalEvents(eventCount);
    setGeneratingCount(0);
    
    // Start progress simulation with realistic timing
    // Estimate: ~3-5 seconds per image, so for 20 images = 60-100 seconds
    const estimatedTimePerImage = 4; // seconds
    const estimatedTotalTime = eventCount * estimatedTimePerImage; // seconds
    const startTime = Date.now();
    
    let progressInterval: NodeJS.Timeout | null = null;
    try {
      progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        // Calculate progress based on elapsed time vs estimated time
        // Use a logarithmic curve to slow down as we approach 90%
        let calculatedProgress = Math.min(90, (elapsed / estimatedTotalTime) * 90);
        
        // Apply logarithmic curve to make progress slow down as it approaches 90%
        // This makes it more realistic - fast at first, slower near the end
        calculatedProgress = 90 * (1 - Math.exp(-elapsed / (estimatedTotalTime * 0.6)));
        
        // If we've exceeded estimated time, slowly continue to 95%
        if (elapsed > estimatedTotalTime) {
          const extraTime = elapsed - estimatedTotalTime;
          // Add up to 5% more progress (90% -> 95%) over the next estimated time period
          const additionalProgress = Math.min(5, (extraTime / estimatedTotalTime) * 5);
          calculatedProgress = 90 + additionalProgress;
        }
        
        setProgress((prev) => {
          // Only update if calculated progress is higher than current, but cap at 95%
          const newProgress = Math.min(95, Math.max(prev, calculatedProgress));
          
          // Update generating count based on progress
          const estimatedCount = Math.floor((newProgress / 100) * eventCount);
          setGeneratingCount(Math.min(estimatedCount, eventCount));
          
          return newProgress;
        });
      }, 500); // Update every 500ms for smoother progress
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
          referencePhoto: referencePhoto && referencePhoto.url && referencePhoto.personName && referencePhoto.hasPermission
            ? {
                url: referencePhoto.url,
                personName: referencePhoto.personName,
              }
            : undefined,
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

      // Clear progress interval and complete progress
      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);
      setGeneratingCount(eventCount);
      
      if (!data.images || data.images.length === 0) {
        throw new Error("No images were generated");
      }
      
      // Update events with images immediately (filter out null values)
      const successfulImages = data.images.filter((img: any) => img !== null);
      const failedCount = data.images.length - successfulImages.length;
      
      // Map images back to selected events only
      let imageIndex = 0;
      const eventsWithImages = events.map((e) => {
        if (selectedEvents.has(e.id)) {
          const imageUrl = data.images[imageIndex] || e.imageUrl;
          imageIndex++;
          return { ...e, imageUrl };
        }
        return e;
      });
      setEvents(eventsWithImages);
      
      // Deduct credits AFTER successful generation
      const creditsDeducted = await deductCredits(
        totalCost, 
        `AI Image Generation for ${eventCount} events`
      );
      
      if (!creditsDeducted) {
        console.warn('Failed to deduct credits after image generation');
      }
      
      // Retry failed images automatically
      if (failedCount > 0) {
        // Find events that failed (have null images)
        // Map images back to events by index
        const failedEvents: TimelineEvent[] = [];
        selectedEventsList.forEach((e, idx) => {
          if (!data.images[idx]) {
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
          let currentEvents = [...eventsWithImages]; // Track events state during retries
          
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
      
      setIsGenerating(false);
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
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

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Generated</TabsTrigger>
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
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
                Total cost: {(() => {
                  const baseCost = CREDIT_COST_IMAGE_BATCH;
                  const additionalImages = Math.max(0, selectedEvents.size - 20);
                  const additionalCost = additionalImages * 0.5;
                  const totalCost = baseCost + additionalCost;
                  return totalCost === baseCost 
                    ? `${baseCost} credits` 
                    : `${baseCost} credits (first 20) + ${additionalCost} credits (${additionalImages} additional) = ${totalCost} credits`;
                })()}
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
                  Generating... {generatingCount > 0 && totalEvents > 0 ? `${generatingCount} of ${totalEvents} events` : `${Math.round(progress)}%`}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Images ({(() => {
                    const baseCost = CREDIT_COST_IMAGE_BATCH;
                    const additionalImages = Math.max(0, selectedEvents.size - 20);
                    const additionalCost = additionalImages * 0.5;
                    return baseCost + additionalCost;
                  })()} credits)
                </>
              )}
            </Button>

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
                              Regenerate {(() => {
                                const count = regenerationCount[event.id] || 0;
                                if (count < 5) {
                                  return `(${5 - count} free)`;
                                }
                                return "(10 credits)";
                              })()}
                            </>
                          )}
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
        required={(() => {
          const baseCost = CREDIT_COST_IMAGE_BATCH;
          const additionalImages = Math.max(0, events.filter(e => selectedEvents.has(e.id)).length - 20);
          const additionalCost = additionalImages * 0.5;
          return baseCost + additionalCost;
        })()}
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

