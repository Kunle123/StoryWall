"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimelineCard } from "@/components/timeline/TimelineCard";
import { TimelineEvent } from "@/components/timeline/Timeline";
import { Save, Eye, Loader2 } from "lucide-react";
import { getOrCreatePortfolioTimeline, createEvent } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const CardEditor = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<TimelineEvent>({
    id: "",
    year: new Date().getFullYear(),
    month: undefined,
    day: undefined,
    title: "",
    description: "",
    category: "event",
    image: "",
    video: "",
  });

  const handleSave = async () => {
    if (!formData.title || !formData.year) {
      toast({
        title: "Validation Error",
        description: "Title and year are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get or create portfolio timeline
      const portfolioResult = await getOrCreatePortfolioTimeline();
      if (portfolioResult.error || !portfolioResult.data) {
        throw new Error(portfolioResult.error || "Failed to get portfolio timeline");
      }

      const portfolioTimeline = portfolioResult.data;

      // Format date (YYYY-MM-DD)
      const day = formData.day || 1;
      const month = formData.month || 1;
      const dateStr = `${formData.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Create event in portfolio timeline
      const eventResult = await createEvent(portfolioTimeline.id, {
        title: formData.title,
        description: formData.description || undefined,
        date: dateStr,
        image_url: formData.image || undefined,
        category: formData.category || undefined,
      });

      if (eventResult.error) {
        throw new Error(eventResult.error);
      }

      toast({
        title: "Success!",
        description: "Card saved to your portfolio",
      });

      // Navigate to portfolio after a brief delay
      setTimeout(() => {
        router.push("/portfolio");
      }, 1000);
    } catch (error: any) {
      console.error("Error saving card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save card. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Card Editor</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Create a new timeline card for your collection</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Editor Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Card Details</CardTitle>
              <CardDescription>Fill in the information for your timeline event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="year" className="text-sm">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-sm">Month</Label>
                  <Input
                    id="month"
                    type="number"
                    placeholder="1-12"
                    min="1"
                    max="12"
                    value={formData.month || ""}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day" className="text-sm">Day</Label>
                  <Input
                    id="day"
                    type="number"
                    placeholder="1-31"
                    min="1"
                    max="31"
                    value={formData.day || ""}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="innovation">Innovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="video">Video URL</Label>
                <Input
                  id="video"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video}
                  onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!formData.title || !formData.year || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Portfolio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg sm:text-xl">Live Preview</CardTitle>
                <CardDescription className="text-sm">See how your card will look on the timeline</CardDescription>
              </CardHeader>
              <CardContent>
                {showPreview && formData.title ? (
                  <div className="flex justify-center max-w-sm mx-auto">
                    <TimelineCard 
                      event={{ ...formData, id: "preview" }}
                      side="left"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {!formData.title ? "Add a title to see preview" : "Click 'Show Preview' to view your card"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-primary/5 border-primary/20 hidden sm:block">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-display">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p>• Keep titles concise (under 60 characters)</p>
                <p>• Use high-quality images for best results</p>
                <p>• Categories help organize and color-code your events</p>
                <p>• Add month and day for more precise timeline placement</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CardEditor;
