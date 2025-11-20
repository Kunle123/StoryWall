"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Play, Music, Image as ImageIcon, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TimelineEvent } from "./Timeline";
import { SlideshowOptions, generateNarrationScript, generateEventNarrationScript, prepareImagesForSlideshow } from "@/lib/utils/tiktokSlideshow";
import { generateSlideshowVideo, downloadAudio } from "@/lib/utils/videoGeneration";
import JSZip from "jszip";
import { TikTokSlideshowPreview } from "./TikTokSlideshowPreview";
import { TimelineTweetTemplate } from "./TimelineTweetTemplate";

interface TikTokSlideshowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineTitle: string;
  timelineDescription?: string;
  events: TimelineEvent[];
  timelineId?: string;
  timelineUrl?: string;
}

export function TikTokSlideshowDialog({
  open,
  onOpenChange,
  timelineTitle,
  timelineDescription,
  events,
  timelineId,
  timelineUrl,
}: TikTokSlideshowDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'native' | 'video'>('native'); // 'native' for TikTok Photo Mode, 'video' for video file
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  
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

  // Clean up URLs when dialog closes
  useEffect(() => {
    if (!open) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        setVideoBlob(null);
      }
      if (zipUrl) {
        URL.revokeObjectURL(zipUrl);
        setZipUrl(null);
        setZipBlob(null);
      }
      setProgress(0);
      setProgressMessage("");
    }
  }, [open, videoUrl, zipUrl]);

  // Generate ZIP file from images for native TikTok slideshow
  const generateZipFromImages = async (images: Blob[]): Promise<Blob> => {
    const zip = new JSZip();
    
    // Add each image to the ZIP with sequential naming
    for (let i = 0; i < images.length; i++) {
      const imageBlob = images[i];
      const fileName = `slide-${(i + 1).toString().padStart(3, '0')}.jpg`;
      zip.file(fileName, imageBlob);
    }
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  };

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

      // Branch based on mode
      if (mode === 'native') {
        // Native TikTok Photo Mode: Generate ZIP file
        setProgress(70);
        setProgressMessage("Creating ZIP file...");
        
        const zipBlob = await generateZipFromImages(preparedImages);
        const zipUrl = URL.createObjectURL(zipBlob);
        setZipBlob(zipBlob);
        setZipUrl(zipUrl);
        
        setProgress(100);
        setProgressMessage("Complete!");
        
        toast({
          title: "Success!",
          description: "Slideshow images ready. Download the ZIP and upload to TikTok Photo Mode.",
        });
        return; // Exit early for native mode
      }

      // Video mode: Continue with video generation

      // Step 2: Generate voiceover if enabled (video mode only)
      let audioBlob: Blob | undefined;
      let perImageDurations: number[] | undefined;
      
      if (options.addVoiceover) {
        setProgress(40);
        setProgressMessage("Generating natural narration scripts...");
        
        // Generate narration script for each event that has an image
        const eventsWithImages = events.filter(e => e.image).slice(0, 20);
        
        // Use AI to generate natural, abridged narration scripts
        try {
          const narrationResponse = await fetch('/api/ai/generate-slideshow-narration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              events: eventsWithImages,
              timelineTitle,
              timelineDescription,
            }),
          });

          if (!narrationResponse.ok) {
            throw new Error('Failed to generate narration scripts');
          }

          const { scripts: narrationScripts } = await narrationResponse.json();
          
          if (!narrationScripts || narrationScripts.length === 0) {
            throw new Error('No narration scripts generated');
          }
          
          // Use AI-generated scripts
          const finalScripts = narrationScripts;
          
          setProgress(45);
          setProgressMessage(`Generating audio for ${finalScripts.length} segments in one batch...`);
          
          // Use batched API to reduce API calls - all scripts in one call
          const voiceoverResponse = await fetch('/api/ai/generate-voiceover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scripts: finalScripts, // Pass array of scripts for batching
              voice: options.voice,
            }),
          });

          if (!voiceoverResponse.ok) {
            let errorMessage = 'Failed to generate voiceover';
            try {
              const errorData = await voiceoverResponse.json();
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (e) {
              errorMessage = `${errorMessage}: ${voiceoverResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const { audioUrl, duration: totalDuration, segmentDurations, segmentBoundaries, isBatch } = await voiceoverResponse.json();
          if (!audioUrl) {
            throw new Error('No audio URL returned from voiceover generation');
          }
          
          // Create audio segments array from batched response
          const audioSegments: { url: string; duration: number }[] = [];
          if (isBatch && segmentDurations && segmentDurations.length > 0) {
            // For batched mode, we have one audio URL but multiple segment durations
            // We'll need to split the audio later, but for now use the combined audio
            // and store individual durations for video sync
            for (let i = 0; i < segmentDurations.length; i++) {
              audioSegments.push({ 
                url: audioUrl, // Same URL for all segments (we'll split it)
                duration: segmentDurations[i] 
              });
            }
          } else {
            // Fallback: single segment
            audioSegments.push({ url: audioUrl, duration: totalDuration });
          }
          
          setProgress(60);
          setProgressMessage("Preparing audio and calculating durations...");
          
          // Download the combined audio (already combined by the API in batched mode)
          audioBlob = await downloadAudio(audioUrl);
          
          // Get actual total audio duration
          const { getAudioDuration } = await import('@/lib/utils/audioDuration');
          const actualAudioDuration = await getAudioDuration(audioBlob);
          console.log('[TikTokSlideshowDialog] Actual audio duration:', actualAudioDuration, 'seconds');
          
          // Calculate per-image durations based on actual audio duration
          // Distribute the actual audio duration proportionally across segments
          perImageDurations = [];
          if (isBatch && segmentDurations && segmentDurations.length > 0) {
            // Calculate total estimated duration
            const totalEstimatedDuration = segmentDurations.reduce((sum: number, d: number) => sum + d, 0);
            // Scale each duration proportionally to match actual audio
            const scaleFactor = actualAudioDuration / totalEstimatedDuration;
            console.log('[TikTokSlideshowDialog] Scaling durations by factor:', scaleFactor);
            
            for (let i = 0; i < preparedImages.length; i++) {
              if (i < segmentDurations.length) {
                // Scale the estimated duration to match actual audio
                const scaledDuration = segmentDurations[i] * scaleFactor;
                // Clamp to 5-10 seconds as requested
                const clampedDuration = Math.max(5, Math.min(10, scaledDuration));
                perImageDurations.push(clampedDuration);
              } else {
                // If we have more images than segments, use the last segment duration
                const lastDuration = segmentDurations[segmentDurations.length - 1] * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, lastDuration)));
              }
            }
          } else if (audioSegments.length > 0) {
            // Fallback: use audio segments durations, scaled to actual audio
            const totalEstimatedDuration = audioSegments.reduce((sum: number, s: { url: string; duration: number }) => sum + s.duration, 0);
            const scaleFactor = actualAudioDuration / totalEstimatedDuration;
            
            for (let i = 0; i < preparedImages.length; i++) {
              if (i < audioSegments.length) {
                const scaledDuration = audioSegments[i].duration * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, scaledDuration)));
              } else {
                const lastDuration = audioSegments[audioSegments.length - 1].duration * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, lastDuration)));
              }
            }
          } else {
            // Fallback: distribute actual audio duration evenly across images
            const durationPerImage = actualAudioDuration / preparedImages.length;
            for (let i = 0; i < preparedImages.length; i++) {
              perImageDurations.push(Math.max(5, Math.min(10, durationPerImage)));
            }
          }
          
          console.log('[TikTokSlideshowDialog] Per-image durations (scaled to match actual audio):', perImageDurations);
          console.log('[TikTokSlideshowDialog] Total video duration:', perImageDurations.reduce((sum: number, d: number) => sum + d, 0), 'seconds');
          console.log('[TikTokSlideshowDialog] Actual audio duration:', actualAudioDuration, 'seconds');
          
          setProgress(65);
          setProgressMessage("Voiceover ready!");
        } catch (narrationError: any) {
          console.warn('[TikTokSlideshowDialog] AI narration generation failed, using fallback:', narrationError);
          // Fallback to simple script generation
          const fallbackScripts: string[] = [];
          eventsWithImages.forEach((event, index) => {
            const isFirst = index === 0;
            const isLast = index === eventsWithImages.length - 1;
            let script = generateEventNarrationScript(event, isFirst, isLast);
            
            // Add intro to first event
            if (isFirst) {
              let introText = `Welcome to ${timelineTitle}.`;
              if (timelineDescription) {
                const shortDesc = timelineDescription.length > 80
                  ? timelineDescription.substring(0, 80) + '...'
                  : timelineDescription;
                introText += ` ${shortDesc}`;
              }
              introText += ' Let\'s explore the key moments. ';
              script = introText + script;
            }
            
            fallbackScripts.push(script);
          });
          
          setProgress(45);
          setProgressMessage(`Generating audio for ${fallbackScripts.length} segments in one batch...`);
          
          // Use batched API to reduce API calls - all scripts in one call
          const voiceoverResponse = await fetch('/api/ai/generate-voiceover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scripts: fallbackScripts, // Pass array of scripts for batching
              voice: options.voice,
            }),
          });

          if (!voiceoverResponse.ok) {
            let errorMessage = 'Failed to generate voiceover';
            try {
              const errorData = await voiceoverResponse.json();
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (e) {
              errorMessage = `${errorMessage}: ${voiceoverResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const { audioUrl, duration: totalDuration, segmentDurations, segmentBoundaries, isBatch } = await voiceoverResponse.json();
          if (!audioUrl) {
            throw new Error('No audio URL returned from voiceover generation');
          }
          
          // Create audio segments array from batched response
          const audioSegments: { url: string; duration: number }[] = [];
          if (isBatch && segmentDurations && segmentDurations.length > 0) {
            // For batched mode, we have one audio URL but multiple segment durations
            // We'll need to split the audio later, but for now use the combined audio
            // and store individual durations for video sync
            for (let i = 0; i < segmentDurations.length; i++) {
              audioSegments.push({ 
                url: audioUrl, // Same URL for all segments (we'll split it)
                duration: segmentDurations[i] 
              });
            }
          } else {
            // Fallback: single segment
            audioSegments.push({ url: audioUrl, duration: totalDuration });
          }
          
          setProgress(60);
          setProgressMessage("Preparing audio and calculating durations...");
          
          // Download the combined audio (already combined by the API in batched mode)
          audioBlob = await downloadAudio(audioUrl);
          
          // Get actual total audio duration
          const { getAudioDuration: getAudioDurationFallback } = await import('@/lib/utils/audioDuration');
          const actualAudioDuration = await getAudioDurationFallback(audioBlob);
          console.log('[TikTokSlideshowDialog] Actual audio duration (fallback):', actualAudioDuration, 'seconds');
          
          // Calculate per-image durations based on actual audio duration
          perImageDurations = [];
          if (isBatch && segmentDurations && segmentDurations.length > 0) {
            const totalEstimatedDuration = segmentDurations.reduce((sum: number, d: number) => sum + d, 0);
            const scaleFactor = actualAudioDuration / totalEstimatedDuration;
            
            for (let i = 0; i < preparedImages.length; i++) {
              if (i < segmentDurations.length) {
                const scaledDuration = segmentDurations[i] * scaleFactor;
                const clampedDuration = Math.max(5, Math.min(10, scaledDuration));
                perImageDurations.push(clampedDuration);
              } else {
                const lastDuration = segmentDurations[segmentDurations.length - 1] * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, lastDuration)));
              }
            }
          } else if (audioSegments.length > 0) {
            const totalEstimatedDuration = audioSegments.reduce((sum: number, s: { url: string; duration: number }) => sum + s.duration, 0);
            const scaleFactor = actualAudioDuration / totalEstimatedDuration;
            
            for (let i = 0; i < preparedImages.length; i++) {
              if (i < audioSegments.length) {
                const scaledDuration = audioSegments[i].duration * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, scaledDuration)));
              } else {
                const lastDuration = audioSegments[audioSegments.length - 1].duration * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, lastDuration)));
              }
            }
          } else {
            const durationPerImage = actualAudioDuration / preparedImages.length;
            for (let i = 0; i < preparedImages.length; i++) {
              perImageDurations.push(Math.max(5, Math.min(10, durationPerImage)));
            }
          }
          
          console.log('[TikTokSlideshowDialog] Per-image durations (fallback, scaled to match actual audio):', perImageDurations);
          console.log('[TikTokSlideshowDialog] Total video duration:', perImageDurations.reduce((sum: number, d: number) => sum + d, 0), 'seconds');
          
          setProgress(65);
          setProgressMessage("Voiceover ready!");
        }
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
    if (mode === 'native' && zipBlob) {
      // Download ZIP for native mode
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timelineTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-tiktok-slideshow.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: "ZIP file saved. Extract and upload images to TikTok Photo Mode.",
      });
    } else if (mode === 'video' && videoBlob) {
      // Download video for video mode
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
        description: "Video saved. Upload it to TikTok or other platforms to share.",
      });
    }
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
            Generate a slideshow from your timeline. {eventsWithImages.length} event{eventsWithImages.length !== 1 ? 's' : ''} with images will be included.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Twitter Tweet Template Preview */}
          {eventsWithImages.length > 0 && eventsWithImages[0]?.imageUrl && !isGenerating && (
            <div className="space-y-2">
              <Label>Share on X/Twitter</Label>
              <TimelineTweetTemplate
                title={timelineTitle}
                description={timelineDescription || `Explore this timeline: ${timelineTitle}`}
                imageUrl={eventsWithImages[0].imageUrl || eventsWithImages[0].image || ''}
                timelineUrl={timelineUrl || (typeof window !== 'undefined' ? `${window.location.origin}/timeline/${timelineId || ''}` : '')}
              />
            </div>
          )}

          {/* Preview Section - Show preview of slideshow design */}
          {eventsWithImages.length > 0 && !isGenerating && (
            <div className="space-y-2">
              <Label>TikTok Slideshow Preview</Label>
              <div className="border rounded-lg p-2 bg-muted/30">
                <TikTokSlideshowPreview
                  events={eventsWithImages}
                  title={timelineTitle}
                />
              </div>
            </div>
          )}

          {/* Mode Selector */}
          {!videoUrl && !zipUrl && (
            <div className="space-y-2">
              <Label>Slideshow Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={mode === 'native' ? 'default' : 'outline'}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setMode('native')}
                >
                  <ImageIcon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Native TikTok</div>
                    <div className="text-xs text-muted-foreground">Photo Mode (swipeable)</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={mode === 'video' ? 'default' : 'outline'}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setMode('video')}
                >
                  <Video className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Video File</div>
                    <div className="text-xs text-muted-foreground">For other platforms</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Settings */}
          {!videoUrl && !zipUrl && (
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

                {mode === 'video' && (
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
                )}
              </div>

              {mode === 'video' && (
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
              )}

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

              {mode === 'video' && (
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
              )}
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

          {/* Native TikTok Slideshow (ZIP) Result */}
          {zipUrl && !isGenerating && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-lg text-center space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-primary" />
                <h4 className="font-semibold text-lg">Slideshow Images Ready!</h4>
                <p className="text-sm text-muted-foreground">
                  {eventsWithImages.length} images prepared for TikTok Photo Mode
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download ZIP
                </Button>
                <Button onClick={handleOpenTikTok} variant="outline" className="gap-2">
                  <Play className="w-4 h-4" />
                  Open TikTok
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <h4 className="font-semibold">How to upload to TikTok Photo Mode:</h4>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Download and extract the ZIP file</li>
                  <li>Open TikTok app and tap the "+" button</li>
                  <li>Tap "Upload" and select all images from the extracted folder</li>
                  <li>Tap "Photo" or "Switch to Photo Mode" at the bottom</li>
                  <li>Add music, text, stickers, or filters</li>
                  <li>Add caption, hashtags, and post!</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Select images in order (slide-001.jpg, slide-002.jpg, etc.) for the correct sequence
                </p>
              </div>
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
                  <li>Open TikTok app (or other platform)</li>
                  <li>Tap the "+" button to create a new video</li>
                  <li>Select "Upload" and choose the downloaded video</li>
                  <li>Add caption, hashtags, and post!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!videoUrl && !zipUrl && (
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
                  {mode === 'native' ? (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Generate Images
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </>
              )}
            </Button>
          )}

          {/* Regenerate Button */}
          {(videoUrl || zipUrl) && !isGenerating && (
            <Button
              onClick={() => {
                setVideoUrl(null);
                setVideoBlob(null);
                setZipUrl(null);
                setZipBlob(null);
              }}
              variant="outline"
              className="w-full"
            >
              Generate New Slideshow
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

