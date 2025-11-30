"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Play, Music, Image as ImageIcon, Video, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchTimelineById, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { SlideshowOptions, prepareImagesForSlideshow } from "@/lib/utils/tiktokSlideshow";
import { generateSlideshowVideo, downloadAudio } from "@/lib/utils/videoGeneration";
import JSZip from "jszip";
import { TikTokSlideshowPreview } from "@/components/timeline/TikTokSlideshowPreview";

export default function TikTokSharePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'native' | 'video'>('native');
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

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const timelineData = await fetchTimelineById(timelineId);
        if (timelineData.error) {
          toast({
            title: "Error",
            description: timelineData.error,
            variant: "destructive",
          });
          router.push(`/timeline/${timelineId}`);
          return;
        }
        setTimeline(timelineData.data);

        const eventsData = await fetchEventsByTimelineId(timelineId);
        if (eventsData.error) {
          console.error("Error fetching events:", eventsData.error);
        } else if (eventsData.data) {
          setEvents(eventsData.data.map((e: any) => transformApiEventToTimelineEvent(e)));
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
        toast({
          title: "Error",
          description: "Failed to load timeline",
          variant: "destructive",
        });
        router.push(`/timeline/${timelineId}`);
      } finally {
        setLoading(false);
      }
    };

    if (timelineId) {
      loadTimeline();
    }
  }, [timelineId, router, toast]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (zipUrl) {
        URL.revokeObjectURL(zipUrl);
      }
    };
  }, [videoUrl, zipUrl]);

  const generateZipFromImages = async (images: Blob[]): Promise<Blob> => {
    const zip = new JSZip();
    for (let i = 0; i < images.length; i++) {
      const imageBlob = images[i];
      const fileName = `slide-${(i + 1).toString().padStart(3, '0')}.jpg`;
      zip.file(fileName, imageBlob);
    }
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
      setProgress(10);
      setProgressMessage("Downloading images...");
      const preparedImages = await prepareImagesForSlideshow(events, options);
      
      if (preparedImages.length === 0) {
        throw new Error("No images available for slideshow");
      }

      setProgress(30);
      setProgressMessage(`Processing ${preparedImages.length} images...`);

      if (mode === 'native') {
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
        return;
      }

      // Video mode
      let audioBlob: Blob | undefined;
      let perImageDurations: number[] | undefined;
      
      if (options.addVoiceover) {
        setProgress(40);
        setProgressMessage("Generating natural narration scripts...");
        
        const eventsWithImages = events.filter(e => e.image).slice(0, 20);
        
        try {
          const narrationResponse = await fetch('/api/ai/generate-slideshow-narration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              events: eventsWithImages,
              timelineTitle: timeline?.title || '',
              timelineDescription: timeline?.description,
            }),
          });

          if (!narrationResponse.ok) {
            throw new Error('Failed to generate narration scripts');
          }

          const { scripts: narrationScripts } = await narrationResponse.json();
          
          if (!narrationScripts || narrationScripts.length === 0) {
            throw new Error('No narration scripts generated');
          }
          
          setProgress(45);
          setProgressMessage(`Generating audio for ${narrationScripts.length} segments...`);
          
          const voiceoverResponse = await fetch('/api/ai/generate-voiceover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scripts: narrationScripts,
              voice: options.voice,
            }),
          });

          if (!voiceoverResponse.ok) {
            throw new Error('Failed to generate voiceover');
          }

          const { audioUrl, segmentDurations, isBatch } = await voiceoverResponse.json();
          if (!audioUrl) {
            throw new Error('No audio URL returned');
          }
          
          setProgress(60);
          setProgressMessage("Preparing audio...");
          
          audioBlob = await downloadAudio(audioUrl);
          
          const { getAudioDuration } = await import('@/lib/utils/audioDuration');
          const actualAudioDuration = await getAudioDuration(audioBlob);
          
          perImageDurations = [];
          if (isBatch && segmentDurations && segmentDurations.length > 0) {
            const totalEstimatedDuration = segmentDurations.reduce((sum: number, d: number) => sum + d, 0);
            const scaleFactor = actualAudioDuration / totalEstimatedDuration;
            
            for (let i = 0; i < preparedImages.length; i++) {
              if (i < segmentDurations.length) {
                const scaledDuration = segmentDurations[i] * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, scaledDuration)));
              } else {
                const lastDuration = segmentDurations[segmentDurations.length - 1] * scaleFactor;
                perImageDurations.push(Math.max(5, Math.min(10, lastDuration)));
              }
            }
          } else {
            const durationPerImage = actualAudioDuration / preparedImages.length;
            for (let i = 0; i < preparedImages.length; i++) {
              perImageDurations.push(Math.max(5, Math.min(10, durationPerImage)));
            }
          }
          
          setProgress(65);
          setProgressMessage("Voiceover ready!");
        } catch (error: any) {
          console.warn('AI narration generation failed:', error);
          // Continue without voiceover
        }
      }

      setProgress(70);
      setProgressMessage("Generating video...");
      
      const videoBlob = await generateSlideshowVideo(preparedImages, options, audioBlob, perImageDurations);
      
      setProgress(90);
      setProgressMessage("Finalizing...");
      
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
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timeline?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'slideshow'}-tiktok-slideshow.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: "ZIP file saved. Extract and upload images to TikTok Photo Mode.",
      });
    } else if (mode === 'video' && videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timeline?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'slideshow'}-tiktok-slideshow.mp4`;
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

  if (loading || !timeline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const eventsWithImages = events.filter(e => e.image).slice(0, 20);
  const timelineUrl = typeof window !== 'undefined' ? `${window.location.origin}/timeline/${timelineId}` : '';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/timeline/${timelineId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Timeline
          </Button>
          <h1 className="text-3xl font-display font-bold mb-2">Create TikTok Slideshow</h1>
          <p className="text-muted-foreground">
            Generate a slideshow from your timeline. {eventsWithImages.length} event{eventsWithImages.length !== 1 ? 's' : ''} with images will be included.
          </p>
        </div>

        <div className="space-y-6">
          {/* Preview Section */}
          {eventsWithImages.length > 0 && !isGenerating && (
            <Card className="p-6">
              <Label className="text-base mb-4 block">TikTok Slideshow Preview</Label>
              <div className="border rounded-lg p-2 bg-muted/30">
                <TikTokSlideshowPreview
                  events={eventsWithImages}
                  title={timeline.title}
                />
              </div>
            </Card>
          )}

          {/* Mode Selector */}
          {!videoUrl && !zipUrl && (
            <Card className="p-6">
              <Label className="text-base mb-4 block">Slideshow Type</Label>
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
            </Card>
          )}

          {/* Settings */}
          {!videoUrl && !zipUrl && (
            <Card className="p-6">
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
            </Card>
          )}

          {/* Progress */}
          {isGenerating && (
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{progressMessage}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </Card>
          )}

          {/* Native TikTok Slideshow (ZIP) Result */}
          {zipUrl && !isGenerating && (
            <Card className="p-6">
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
                </div>
              </div>
            </Card>
          )}

          {/* Video Preview */}
          {videoUrl && !isGenerating && (
            <Card className="p-6">
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
            </Card>
          )}

          {/* Generate Button */}
          {!videoUrl && !zipUrl && (
            <Card className="p-6">
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
            </Card>
          )}

          {/* Regenerate Button */}
          {(videoUrl || zipUrl) && !isGenerating && (
            <Card className="p-6">
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
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

