"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Eye, Save } from "lucide-react";
import { TimelineInfoStep } from "@/components/timeline-editor/TimelineInfoStep";
import { WritingStyleStep, TimelineEvent } from "@/components/timeline-editor/WritingStyleStep";
import { EventDetailsStep } from "@/components/timeline-editor/EventDetailsStep";
import { ImageStyleStep } from "@/components/timeline-editor/ImageStyleStep";
import { GenerateImagesStep } from "@/components/timeline-editor/GenerateImagesStep";
import { createTimeline, createEvent } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { TimelineCard } from "@/components/timeline/TimelineCard";

const TimelineEditor = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [timelineName, setTimelineName] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [imageStyle, setImageStyle] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { number: 1, title: "Timeline Info" },
    { number: 2, title: "Writing Style & Events" },
    { number: 3, title: "Event Details" },
    { number: 4, title: "Image Style" },
    { number: 5, title: "Generate Images" },
  ];

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return timelineName && timelineDescription;
      case 2:
        return writingStyle && events.length > 0 && events.every(e => e.title);
      case 3:
        return events.every(e => e.description);
      case 4:
        return imageStyle;
      default:
        return true;
    }
  };

  const handleSaveTimeline = async () => {
    setIsSaving(true);
    try {
      // Create timeline
      const timelineResult = await createTimeline({
        title: timelineName,
        description: timelineDescription,
        visualization_type: "vertical",
        is_public: false,
        is_collaborative: false,
      });

      if (timelineResult.error || !timelineResult.data) {
        throw new Error(timelineResult.error || "Failed to create timeline");
      }

      const timelineId = timelineResult.data.id;

      // Create all events
      for (const event of events) {
        const dateStr = `${event.year}-01-01`; // Default to January 1st

        await createEvent(timelineId, {
          title: event.title,
          description: event.description,
        date: dateStr,
          image_url: event.imageUrl,
      });
      }

      toast({
        title: "Success!",
        description: "Timeline saved successfully",
      });

      // Navigate to timeline view
      setTimeout(() => {
        router.push(`/timeline/${timelineId}`);
      }, 1000);
    } catch (error: any) {
      console.error("Error saving timeline:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save timeline. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handlePreviewTimeline = () => {
    setShowPreview(!showPreview);
  };

  // Transform events for preview
  const previewEvents = events.map(e => ({
    id: e.id,
    year: e.year,
    title: e.title,
    description: e.description || "",
    category: undefined,
    image: e.imageUrl || "",
    video: "",
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Toaster />
      
      <main className="flex-1 container mx-auto px-4 pt-16 pb-24 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Timeline Editor</h1>
          <p className="text-muted-foreground">Create your AI-powered timeline in 5 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-2 text-center hidden sm:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
              </div>

        {/* Preview Mode */}
        {showPreview && (
          <Card className="p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-display font-semibold mb-2">{timelineName}</h2>
              <p className="text-muted-foreground">{timelineDescription}</p>
                </div>
            <div className="space-y-4">
              {previewEvents.map((event) => (
                <div key={event.id} className="flex justify-center">
                  <TimelineCard event={event} side="left" />
                </div>
              ))}
                </div>
          </Card>
        )}

        {/* Step Content */}
        {!showPreview && (
          <>
            <Card className="p-6 mb-6">
              {currentStep === 1 && (
                <TimelineInfoStep
                  timelineName={timelineName}
                  setTimelineName={setTimelineName}
                  timelineDescription={timelineDescription}
                  setTimelineDescription={setTimelineDescription}
                />
              )}
              {currentStep === 2 && (
                <WritingStyleStep
                  writingStyle={writingStyle}
                  setWritingStyle={setWritingStyle}
                  events={events}
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  timelineName={timelineName}
                />
              )}
              {currentStep === 3 && (
                <EventDetailsStep 
                  events={events} 
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  writingStyle={writingStyle}
                />
              )}
              {currentStep === 4 && (
                <ImageStyleStep 
                  imageStyle={imageStyle}
                  setImageStyle={setImageStyle}
                  themeColor={themeColor}
                  setThemeColor={setThemeColor}
                />
              )}
              {currentStep === 5 && (
                <GenerateImagesStep 
                  events={events} 
                  setEvents={setEvents}
                  imageStyle={imageStyle}
                  themeColor={themeColor}
                />
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep === 5 ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePreviewTimeline}
                    disabled={!canProceed()}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Timeline
                  </Button>
                  <Button
                    onClick={handleSaveTimeline}
                    disabled={!canProceed() || isSaving}
                  >
                    {isSaving ? (
                      <>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Timeline
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </main>

      <BottomMenuBar />
    </div>
  );
};

export default TimelineEditor;
