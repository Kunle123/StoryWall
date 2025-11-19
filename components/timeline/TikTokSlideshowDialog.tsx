"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Play, Music } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TimelineEvent } from "./Timeline";
import { SlideshowOptions, generateNarrationScript, generateEventNarrationScript, prepareImagesForSlideshow } from "@/lib/utils/tiktokSlideshow";
import { generateSlideshowVideo, downloadAudio, combineAudioSegments } from "@/lib/utils/videoGeneration";

interface TikTokSlideshowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineTitle: string;
  timelineDescription?: string;
  events: TimelineEvent[];
}

export function TikTokSlideshowDialog({
  open,
  onOpenChange,
  timelineTitle,
  timelineDescription,
  events,
}: TikTokSlideshowDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [options, setOptions] = useState<SlideshowOptions>({
    aspectRatio: '9:16',
    durationPerSlide: 3,
    transition: 'fade',
    showTitle: true,
    showDate: true,
    showDescription: false,
    textPosition: 'bottom',
    addVoiceover: false,
    voice: 'alloy',
  });

  // Clean up video URL when dialog closes
  useEffect(() => {
    if (!open && videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      setVideoBlob(null);
      setProgress(0);
      setProgressMessage("");
    }
  }, [open, videoUrl]);

  const handleGenerate = async () => {
    if (events.length === 0) {
      toast({
        title: "No events",
        description: "This timeline has no events to generate a slideshow from.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage("Initializing...");

    try {
      // Step 1: Prepare images
      setProgress(10);
      setProgressMessage("Downloading images...");
      const preparedImages = await prepareImagesForSlideshow(events, options);
      
      if (preparedImages.length === 0) {
        throw new Error("No images available for slideshow");
      }

      setProgress(30);
      setProgressMessage(`Processing ${preparedImages.length} images...`);

      // Step 2: Generate voiceover if enabled
      let audioBlob: Blob | undefined;
      let perImageDurations: number[] | undefined;
      
      if (options.addVoiceover) {
        setProgress(40);
        setProgressMessage("Generating narration scripts per slide...");
        
        // Generate narration script for each event that has an image
        const eventsWithImages = events.filter(e => e.image).slice(0, 20);
        const narrationScripts: string[] = [];
        
        // Generate script for each event (no separate intro - first event gets intro text)
        eventsWithImages.forEach((event, index) => {
          const isFirst = index === 0;
          const isLast = index === eventsWithImages.length - 1;
          let script = generateEventNarrationScript(event, isFirst, isLast);
          
          // Add intro to first event
          if (isFirst) {
            let introText = `Welcome to ${timelineTitle}.`;
            if (timelineDescription) {
              const shortDesc = timelineDescription.length > 100
                ? timelineDescription.substring(0, 100) + '...'
                : timelineDescription;
              introText += ` ${shortDesc}`;
            }
            introText += ' Let\'s explore the key moments. ';
            script = introText + script;
          }
          
          narrationScripts.push(script);
        });
        
        setProgress(45);
        setProgressMessage(`Generating ${narrationScripts.length} audio segments...`);
        
        // Generate audio for each narration segment and collect durations
        const audioSegments: { url: string; duration: number }[] = [];
        const totalEvents = narrationScripts.length;
        
        for (let i = 0; i < narrationScripts.length; i++) {
          setProgress(45 + Math.floor((i / totalEvents) * 15));
          setProgressMessage(`Creating voiceover segment ${i + 1} of ${totalEvents}...`);
          
          const voiceoverResponse = await fetch('/api/ai/generate-voiceover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              script: narrationScripts[i],
              voice: options.voice,
            }),
          });

          if (!voiceoverResponse.ok) {
            let errorMessage = `Failed to generate voiceover segment ${i + 1}`;
            try {
              const errorData = await voiceoverResponse.json();
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (e) {
              errorMessage = `${errorMessage}: ${voiceoverResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const { audioUrl, duration } = await voiceoverResponse.json();
          if (!audioUrl) {
            throw new Error(`No audio URL returned for segment ${i + 1}`);
          }
          
          audioSegments.push({ url: audioUrl, duration });
        }
        
        setProgress(60);
        setProgressMessage("Combining audio segments...");
        
        // Download and combine audio segments
        // For now, we'll combine them client-side, but we could also do this server-side
        const audioBlobs: Blob[] = [];
        for (const segment of audioSegments) {
          const blob = await downloadAudio(segment.url);
          audioBlobs.push(blob);
        }
        
        // Combine audio blobs (we'll need to use FFmpeg for this, or do it server-side)
        // For now, let's use the first approach: combine all audio into one blob using FFmpeg
        // Actually, let's pass the segments to video generation and let FFmpeg handle it
        
        // Store per-image durations - each image gets its corresponding narration duration
        // This ensures each slide matches its audio description
        perImageDurations = [];
        if (audioSegments.length > 0) {
          // Each image gets its corresponding audio segment duration
          // This way, slide 1 shows for the duration of audio segment 1, etc.
          for (let i = 0; i < preparedImages.length; i++) {
            if (i < audioSegments.length) {
              perImageDurations.push(audioSegments[i].duration);
            } else {
              // If we have more images than segments, use the last segment duration
              perImageDurations.push(audioSegments[audioSegments.length - 1].duration);
            }
          }
        } else {
          // Fallback: if no audio segments, use default duration
          console.warn('[TikTokSlideshowDialog] No audio segments, using default duration per slide');
          for (let i = 0; i < preparedImages.length; i++) {
            perImageDurations.push(options.durationPerSlide);
          }
        }
        
        console.log('[TikTokSlideshowDialog] Per-image durations (ensuring each slide matches its audio):', perImageDurations);
        console.log('[TikTokSlideshowDialog] Audio segment durations:', audioSegments.map(s => s.duration));
        
        // For now, combine all audio into one blob for simplicity
        // TODO: Could optimize by using FFmpeg to concatenate audio segments
        const combinedAudioBlob = await combineAudioSegments(audioSegments.map(s => s.url));
        audioBlob = combinedAudioBlob;
        
        setProgress(65);
        setProgressMessage("Voiceover ready!");
      }

      // Step 3: Generate video
      setProgress(70);
      setProgressMessage("Generating video...");
      
      const videoBlob = await generateSlideshowVideo(preparedImages, options, audioBlob, perImageDurations);
      
      setProgress(90);
      setProgressMessage("Finalizing...");
      
      // Create object URL for preview/download
      const url = URL.createObjectURL(videoBlob);
      setVideoBlob(videoBlob);
      setVideoUrl(url);
      
      setProgress(100);
      setProgressMessage("Complete!");
      
      toast({
        title: "Success!",
        description: "Slideshow video generated. Download and upload to TikTok.",
      });
    } catch (error: any) {
      console.error('Error generating slideshow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate slideshow",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timelineTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-tiktok-slideshow.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Video saved. Upload it to TikTok to share.",
    });
  };

  const handleOpenTikTok = () => {
    window.open('https://www.tiktok.com/upload', '_blank');
  };

  const eventsWithImages = events.filter(e => e.image).slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create TikTok Slideshow</DialogTitle>
          <DialogDescription>
            Generate a video slideshow from your timeline. {eventsWithImages.length} event{eventsWithImages.length !== 1 ? 's' : ''} with images will be included.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Settings */}
          {!videoUrl && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select
                    value={options.aspectRatio}
                    onValueChange={(value: '9:16' | '16:9' | '1:1') =>
                      setOptions({ ...options, aspectRatio: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                      <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration per Slide: {options.durationPerSlide}s</Label>
                  <Slider
                    value={[options.durationPerSlide]}
                    onValueChange={([value]) =>
                      setOptions({ ...options, durationPerSlide: value })
                    }
                    min={2}
                    max={5}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transition</Label>
                <Select
                  value={options.transition}
                  onValueChange={(value: 'fade' | 'slide' | 'zoom' | 'none') =>
                    setOptions({ ...options, transition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Text Overlay</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showTitle"
                      checked={options.showTitle}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, showTitle: checked as boolean })
                      }
                    />
                    <Label htmlFor="showTitle" className="cursor-pointer">Show Title</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDate"
                      checked={options.showDate}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, showDate: checked as boolean })
                      }
                    />
                    <Label htmlFor="showDate" className="cursor-pointer">Show Date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDescription"
                      checked={options.showDescription}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, showDescription: checked as boolean })
                      }
                    />
                    <Label htmlFor="showDescription" className="cursor-pointer">Show Description</Label>
                  </div>
                </div>
                <Select
                  value={options.textPosition}
                  onValueChange={(value: 'top' | 'bottom') =>
                    setOptions({ ...options, textPosition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Text at Top</SelectItem>
                    <SelectItem value="bottom">Text at Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addVoiceover"
                    checked={options.addVoiceover}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, addVoiceover: checked as boolean })
                    }
                  />
                  <Label htmlFor="addVoiceover" className="cursor-pointer flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Add Voiceover Narration
                  </Label>
                </div>
                {options.addVoiceover && (
                  <Select
                    value={options.voice}
                    onValueChange={(value) =>
                      setOptions({ ...options, voice: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progressMessage}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Video Preview */}
          {videoUrl && !isGenerating && (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download Video
                </Button>
                <Button onClick={handleOpenTikTok} variant="outline" className="gap-2">
                  <Play className="w-4 h-4" />
                  Open TikTok
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <h4 className="font-semibold">How to upload:</h4>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Download the video</li>
                  <li>Open TikTok app</li>
                  <li>Tap the "+" button to create a new video</li>
                  <li>Select "Upload" and choose the downloaded video</li>
                  <li>Add caption, hashtags, and post!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!videoUrl && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || eventsWithImages.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Slideshow
                </>
              )}
            </Button>
          )}

          {/* Regenerate Button */}
          {videoUrl && !isGenerating && (
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="w-full"
            >
              Regenerate with Different Settings
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

