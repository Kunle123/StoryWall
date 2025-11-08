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
  const [personName, setPersonName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [imageStyle, setImageStyle] = useState("Photorealistic");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!personName && !eventTitle) {
      toast({
        title: "Missing information",
        description: "Please enter at least a person name or event title.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setFinalPrompt("");

    try {
      // Build the event object
      const event = {
        title: eventTitle || `${personName} - Test Event`,
        description: eventDescription || `A scene featuring ${personName}`,
        year: 2024,
        imagePrompt: useCustomPrompt && customPrompt ? customPrompt : undefined,
      };

      // Build image references if URL provided
      const imageReferences = referenceImageUrl
        ? [{ name: personName || "Person", url: referenceImageUrl }]
        : [];

      const response = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [event],
          imageStyle,
          themeColor: "",
          imageReferences: imageReferences.length > 0 ? imageReferences : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.images || data.images.length === 0) {
        throw new Error("No images were generated");
      }

      setGeneratedImageUrl(data.images[0]);
      setFinalPrompt(data.prompts?.[0] || "Prompt not returned");
      
      toast({
        title: "Success!",
        description: "Image generated successfully",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to generate image";
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
          Test and tweak image generation prompts for famous people
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="personName">Famous Person Name</Label>
              <Input
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g., Joe Biden, Taylor Swift"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Presidential announcement"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe the scene or event..."
                rows={3}
                className="mt-1"
              />
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
              <Label htmlFor="referenceImageUrl">Reference Image URL (Optional)</Label>
              <Input
                id="referenceImageUrl"
                value={referenceImageUrl}
                onChange={(e) => setReferenceImageUrl(e.target.value)}
                placeholder="https://upload.wikimedia.org/..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Direct image URL for person matching
              </p>
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

