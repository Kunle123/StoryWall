"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

interface Event {
  title: string;
  description: string;
  imagePrompt?: string;
  imageUrl?: string | null;
  year?: number;
}

interface DescriptionResponse {
  descriptions: string[];
  imagePrompts: string[];
  anchorStyle?: string;
}

export default function TestImagePromptPage() {
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [imageStyle, setImageStyle] = useState("Illustration");
  const [themeColor, setThemeColor] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [anchorStyle, setAnchorStyle] = useState<string | null>(null);
  const [includesPeople, setIncludesPeople] = useState(false);

  const handleGenerateEvents = async () => {
    if (!timelineTitle || !timelineDescription) {
      alert("Please enter a timeline title and description");
      return;
    }

    setLoadingEvents(true);
    try {
      const response = await fetch("/api/ai/generate-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineName: timelineTitle,
          timelineDescription: timelineDescription,
          maxEvents: 10,
          isFactual: true,
          isNumbered: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || errorData.message || `Failed to generate events: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error: any) {
      console.error("Error generating events:", error);
      alert(`Error: ${error.message}\n\nCheck the browser console for more details.`);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleGenerateDescriptions = async () => {
    if (events.length === 0) {
      alert("Please generate events first");
      return;
    }

    setLoadingDescriptions(true);
    try {
      const response = await fetch("/api/ai/generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map(e => ({
            title: e.title,
            description: e.description || "",
            year: e.year,
          })),
          timelineDescription: timelineDescription,
          imageStyle: imageStyle,
          themeColor: themeColor,
          includesPeople: false, // Default to false for testing
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || errorData.message || `Failed to generate descriptions: ${response.statusText}`);
      }

      const data: DescriptionResponse = await response.json();
      const updatedEvents = events.map((event, idx) => ({
        ...event,
        description: data.descriptions?.[idx] || event.description,
        imagePrompt: data.imagePrompts?.[idx] || event.imagePrompt,
      }));
      setEvents(updatedEvents);
      // Store anchor style for image generation
      if (data.anchorStyle) {
        setAnchorStyle(data.anchorStyle);
        console.log('[TestPage] Received anchor style:', data.anchorStyle.substring(0, 100) + '...');
      }
    } catch (error: any) {
      console.error("Error generating descriptions:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingDescriptions(false);
    }
  };

  const handleGenerateImages = async () => {
    if (events.length === 0) {
      alert("Please generate events and descriptions first");
      return;
    }

    setGeneratingImages(true);
    setImageProgress(0);

    try {
      const response = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map(e => ({
            title: e.title,
            description: e.description || "",
            year: e.year,
            imagePrompt: e.imagePrompt,
          })),
          imageStyle: imageStyle,
          themeColor: themeColor,
          includesPeople: false,
          imageReferences: [],
          anchorStyle: anchorStyle, // Pass anchor style for consistent visual linking
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to generate images: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[TestPage] Image generation response:', data);
      
      // Update events with image URLs
      // The API returns images array with { url: string } objects
      const updatedEvents = events.map((event, idx) => ({
        ...event,
        imageUrl: data.images?.[idx]?.url || data.images?.[idx] || null,
      }));
      setEvents(updatedEvents);
      
      // Count successful images
      const successfulImages = updatedEvents.filter(e => e.imageUrl).length;
      setImageProgress(successfulImages);
      
      if (successfulImages === 0) {
        alert('No images were generated. Check the console for error details.');
      } else {
        console.log(`[TestPage] Successfully generated ${successfulImages}/${events.length} images`);
      }
    } catch (error: any) {
      console.error("Error generating images:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setGeneratingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Prompt Test Page</h1>
          <p className="text-muted-foreground">
            Test how prompts are constructed and how consistent styles are applied across multiple events
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Timeline Title</Label>
              <Input
                id="title"
                value={timelineTitle}
                onChange={(e) => setTimelineTitle(e.target.value)}
                placeholder="e.g., Fetal Development"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Timeline Description</Label>
              <Textarea
                id="description"
                value={timelineDescription}
                onChange={(e) => setTimelineDescription(e.target.value)}
                placeholder="e.g., A timeline showing the stages of fetal development from conception to birth"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Image Style</Label>
                <Select value={imageStyle} onValueChange={setImageStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Illustration">Illustration</SelectItem>
                    <SelectItem value="Watercolor">Watercolor</SelectItem>
                    <SelectItem value="Sketch">Sketch</SelectItem>
                    <SelectItem value="Minimalist">Minimalist</SelectItem>
                    <SelectItem value="Vintage">Vintage</SelectItem>
                    <SelectItem value="3D Render">3D Render</SelectItem>
                    <SelectItem value="Abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Theme Color (Optional)</Label>
                <Input
                  id="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="e.g., #3B82F6 or leave empty"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includesPeople"
                checked={includesPeople}
                onCheckedChange={(checked) => setIncludesPeople(checked === true)}
              />
              <Label
                htmlFor="includesPeople"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Timeline includes people (enables reference image fetching)
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerateEvents}
                disabled={loadingEvents || loadingDescriptions || generatingImages || !timelineTitle || !timelineDescription}
              >
                {loadingEvents ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "1. Generate 10 Events"
                )}
              </Button>

              <Button
                onClick={handleGenerateDescriptions}
                disabled={loadingEvents || loadingDescriptions || generatingImages || events.length === 0}
                variant="outline"
              >
                {loadingDescriptions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "2. Generate Descriptions & Prompts"
                )}
              </Button>

              <Button
                onClick={handleGenerateImages}
                disabled={loadingEvents || loadingDescriptions || generatingImages || events.length === 0}
                variant="outline"
              >
                {generatingImages ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Images... ({imageProgress}/{events.length})
                  </>
                ) : (
                  "3. Generate Images"
                )}
              </Button>
            </div>
          </div>
        </Card>

        {events.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Events ({events.length})
            </h2>

            {events.map((event, idx) => (
              <Card key={idx} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <Label className="text-sm font-semibold text-gray-500">Event {idx + 1}</Label>
                      <h3 className="text-xl font-semibold mt-1">{event.title}</h3>
                      {event.year && (
                        <p className="text-sm text-muted-foreground">Year: {event.year}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-semibold text-gray-500">Description</Label>
                      <p className="mt-1 text-sm">{event.description || "No description yet"}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Image Prompt</Label>
                      <div className="mt-1 p-3 bg-gray-100 rounded text-sm font-mono break-words whitespace-pre-wrap">
                        {event.imagePrompt || "No prompt generated yet"}
                      </div>
                      {event.imagePrompt && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <p>Length: {event.imagePrompt.length} characters</p>
                          <p>Limit: 1,500 characters</p>
                          <p className={event.imagePrompt.length > 1500 ? "text-red-600 font-semibold" : "text-green-600"}>
                            {event.imagePrompt.length > 1500 ? "⚠️ Exceeds limit (will be truncated)" : "✓ Within limit"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Generated Image</Label>
                    {event.imageUrl ? (
                      <div className="mt-1">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="mt-1 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-muted-foreground">
                        No image generated yet
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

