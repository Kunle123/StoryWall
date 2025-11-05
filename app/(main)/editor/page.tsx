"use client";

import { useState, useEffect } from "react";
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

const STORAGE_KEY = 'timeline-editor-state';

const TimelineEditor = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [timelineName, setTimelineName] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true); // Default to public so timelines appear in discover
  const [isFactual, setIsFactual] = useState(true); // Default to factual timelines
  const [writingStyle, setWritingStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [imageStyle, setImageStyle] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setTimelineName(state.timelineName || "");
        setTimelineDescription(state.timelineDescription || "");
        setIsPublic(state.isPublic !== undefined ? state.isPublic : true);
        setIsFactual(state.isFactual !== undefined ? state.isFactual : true);
        setWritingStyle(state.writingStyle || "");
        setCustomStyle(state.customStyle || "");
        setImageStyle(state.imageStyle || "");
        setThemeColor(state.themeColor || "");
        setEvents(state.events || []);
        setCurrentStep(state.currentStep || 1);
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      timelineName,
      timelineDescription,
      isPublic,
      isFactual,
      writingStyle,
      customStyle,
      imageStyle,
      themeColor,
      events,
      currentStep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [timelineName, timelineDescription, isPublic, isFactual, writingStyle, customStyle, imageStyle, themeColor, events, currentStep]);

  // Handle Stripe success return
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const credits = params.get('credits');
      
      if (success === 'true' && credits) {
        // Refresh credits and show success message
        import('@/hooks/use-credits').then(({ useCredits }) => {
          const creditsStore = useCredits.getState();
          creditsStore.fetchCredits().then(() => {
            toast({
              title: "Payment Successful!",
              description: `You've received ${credits} credits. Your balance has been updated.`,
            });
          });
        });
        
        // Remove query params
        router.replace('/editor');
      }
    }
  }, [router, toast]);

  const steps = [
    { number: 1, title: "Timeline Info" },
    { number: 2, title: "Writing Style & Events" },
    { number: 3, title: "Event Details" },
    { number: 4, title: "Image Style" },
    { number: 5, title: "Generate Images" },
  ];

  // Scroll to top on step change (matching design)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return timelineName && timelineDescription;
      case 2:
        return (writingStyle || customStyle) && events.length > 0 && events.every(e => e.title);
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
      console.log('[Timeline Save] Starting timeline creation...', { 
        title: timelineName, 
        eventCount: events.length 
      });

      // Create timeline
      const timelineResult = await createTimeline({
        title: timelineName,
        description: timelineDescription,
        visualization_type: "vertical",
        is_public: isPublic,
        is_collaborative: false,
      });

      console.log('[Timeline Save] Timeline creation result:', timelineResult);

      if (timelineResult.error || !timelineResult.data) {
        const errorMsg = timelineResult.error || "Failed to create timeline";
        console.error('[Timeline Save] Timeline creation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const timelineId = timelineResult.data.id;
      console.log('[Timeline Save] Timeline created successfully, ID:', timelineId);

      // Create all events
      const eventResults = [];
      for (const event of events) {
        try {
          // Format date: only include month/day if they are actually known
          // Use Jan 1 as placeholder for year-only dates (DB requires full date)
          const hasMonth = (event as any).month && (event as any).month >= 1 && (event as any).month <= 12;
          const hasDay = (event as any).day && (event as any).day >= 1 && (event as any).day <= 31;
          
          // Use actual month/day if provided, otherwise use Jan 1 as placeholder
          // We'll detect this in formatting to show year-only when appropriate
          const month = hasMonth ? (event as any).month : 1;
          const day = hasDay ? (event as any).day : 1;
          const dateStr = `${event.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const eventResult = await createEvent(timelineId, {
            title: event.title,
            description: event.description || "",
        date: dateStr,
            image_url: event.imageUrl || undefined,
          });

          eventResults.push({ success: true, event: event.title });
        } catch (eventError: any) {
          console.error(`Failed to create event "${event.title}":`, eventError);
          eventResults.push({ 
            success: false, 
            event: event.title, 
            error: eventError.message || 'Unknown error' 
          });
        }
      }

      // Check if any events failed
      const failedEvents = eventResults.filter(r => !r.success);
      const successfulEvents = eventResults.filter(r => r.success);
      
      console.log(`[Timeline Save] Events summary: ${successfulEvents.length} successful, ${failedEvents.length} failed`);
      
      if (failedEvents.length > 0) {
        console.warn('[Timeline Save] Failed events:', failedEvents);
        toast({
          title: "Warning",
          description: `Timeline created but ${failedEvents.length} event(s) failed to save.`,
          variant: "destructive",
        });
      }

      if (successfulEvents.length === events.length) {
      toast({
        title: "Success!",
          description: "Timeline saved successfully",
        });
      } else {
        toast({
          title: "Partially Saved",
          description: `Timeline created with ${successfulEvents.length}/${events.length} events saved.`,
        });
      }

      // Clear saved state since timeline is saved
      localStorage.removeItem(STORAGE_KEY);

      // Navigate to timeline view
      setTimeout(() => {
        router.push(`/timeline/${timelineId}`);
      }, 1000);
    } catch (error: any) {
      console.error("[Timeline Save] Error saving timeline:", error);
      console.error("[Timeline Save] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to save timeline. Please check the console for details.",
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
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                  isFactual={isFactual}
                  setIsFactual={setIsFactual}
                />
              )}
              {currentStep === 2 && (
                <WritingStyleStep
                  writingStyle={writingStyle}
                  setWritingStyle={setWritingStyle}
                  customStyle={customStyle}
                  setCustomStyle={setCustomStyle}
                  events={events}
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  timelineName={timelineName}
                  isFactual={isFactual}
                />
              )}
              {currentStep === 3 && (
                <EventDetailsStep 
                  events={events} 
                  setEvents={setEvents}
                  timelineDescription={timelineDescription}
                  writingStyle={writingStyle}
                  imageStyle={imageStyle} // Pass if already selected (user may have gone back)
                  themeColor={themeColor} // Pass if already selected
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
