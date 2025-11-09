"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function TestImageGenPage() {
  const { toast } = useToast();
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [imageStyle, setImageStyle] = useState("Photorealistic");
  const [referenceImages, setReferenceImages] = useState<Array<{name: string, url: string}>>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);


  const handleGenerate = async () => {
    if (!eventTitle && !eventDescription) {
      toast({
        title: "Missing information",
        description: "Please enter an event title or description.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setFinalPrompt("");
    setReferenceImages([]);

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      // Build the event object - API will extract person names and fetch reference images automatically
      const event = {
        title: eventTitle || "Test Event",
        description: eventDescription || "",
        year: 2024,
        imagePrompt: useCustomPrompt && customPrompt ? customPrompt : undefined,
      };

      const response = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [event],
          imageStyle,
          themeColor: "",
          // Don't pass imageReferences - let the API extract person names and fetch them automatically
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.images || data.images.length === 0) {
        throw new Error("No images were generated");
      }

      setGeneratedImageUrl(data.images[0]);
      setFinalPrompt(data.prompts?.[0] || "Prompt not returned");
      
      // Display auto-fetched reference images if available
      if (data.referenceImages && data.referenceImages.length > 0) {
        setReferenceImages(data.referenceImages);
        toast({
          title: "Success!",
          description: `Image generated with ${data.referenceImages.length} reference image${data.referenceImages.length > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "Success!",
          description: "Image generated successfully",
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      let errorMsg = err.message || "Failed to generate image";
      if (err.name === 'AbortError') {
        errorMsg = "Request timed out after 5 minutes. The image generation may still be processing.";
      }
      setError(errorMsg);
      toast({
        title: "Generation failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Generation Test Tool</h1>
        <p className="text-muted-foreground">
          Enter an event title/description - the API will automatically extract famous person names and fetch reference images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Taylor Swift shouting at Kanye West"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include famous person names in the title or description
              </p>
            </div>

            <div>
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe the scene or event... (e.g., Taylor Swift confronts Kanye West at the 2009 VMAs)"
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The API will automatically extract person names and fetch reference images
              </p>
            </div>

            <div>
              <Label>Image Style</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {imageStyles.map((style) => (
                  <Badge
                    key={style}
                    variant={imageStyle === style ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setImageStyle(style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useCustomPrompt"
                  checked={useCustomPrompt}
                  onChange={(e) => setUseCustomPrompt(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useCustomPrompt" className="cursor-pointer">
                  Use Custom Prompt (override AI-generated)
                </Label>
              </div>
              {useCustomPrompt && (
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom image prompt..."
                  rows={4}
                  className="mt-1"
                />
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output Display */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Result</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">Error:</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {/* Reference Images Section */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-2 block">
              Reference Images {isGenerating && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
            </Label>
            {isGenerating && referenceImages.length === 0 && (
              <div className="p-4 border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground text-center">Extracting person names and fetching reference images...</p>
              </div>
            )}
            {!isGenerating && referenceImages.length === 0 && (
              <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Reference images will appear here after generation (if famous people are detected)
                </p>
              </div>
            )}
            {referenceImages.length > 0 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {referenceImages.map((ref, idx) => (
                  <div key={idx} className="border-2 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-3 bg-primary/10 border-b">
                      <p className="text-sm font-semibold">{ref.name}</p>
                    </div>
                    <div className="bg-muted/50 p-2">
                      <img
                        src={ref.url}
                        alt={ref.name}
                        className="w-full h-auto rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="p-8 text-center"><p class="text-sm text-muted-foreground">Failed to load image</p><p class="text-xs text-muted-foreground mt-2 break-all">' + ref.url.substring(0, 100) + '...</p></div>';
                          }
                        }}
                      />
                    </div>
                    <div className="p-2 bg-muted/30">
                      <p className="text-xs text-muted-foreground break-all truncate" title={ref.url}>
                        {ref.url}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {finalPrompt && (
            <div className="mb-4">
              <Label className="text-sm font-medium">Generated Prompt:</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap break-words">{finalPrompt}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(finalPrompt);
                  toast({
                    title: "Copied!",
                    description: "Prompt copied to clipboard",
                  });
                }}
              >
                Copy Prompt
              </Button>
            </div>
          )}

          {generatedImageUrl ? (
            <div>
              <Label className="text-sm font-medium">Generated Image:</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt="Generated"
                  className="w-full h-auto"
                  onError={() => {
                    setError("Failed to load generated image");
                    setGeneratedImageUrl(null);
                  }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedImageUrl, "_blank")}
                >
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                {isGenerating ? "Generating image..." : "No image generated yet"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

