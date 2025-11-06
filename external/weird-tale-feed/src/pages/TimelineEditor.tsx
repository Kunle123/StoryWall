import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomMenuBar } from "@/components/BottomMenuBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TimelineInfoStep } from "@/components/timeline-editor/TimelineInfoStep";
import { WritingStyleStep } from "@/components/timeline-editor/WritingStyleStep";
import { EventDetailsStep } from "@/components/timeline-editor/EventDetailsStep";
import { FinalStep } from "@/components/timeline-editor/FinalStep";

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description?: string;
  imageUrl?: string;
}

const TimelineEditor = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [timelineName, setTimelineName] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [allowFictional, setAllowFictional] = useState(false);
  const [writingStyle, setWritingStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [imageStyle, setImageStyle] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const steps = [
    { number: 1, title: "Timeline Info" },
    { number: 2, title: "Writing Style & Events" },
    { number: 3, title: "Event Details" },
    { number: 4, title: "Images" },
    { number: 5, title: "Review & Publish" },
  ];

  const maxStep = steps.length;

  const handleNext = () => {
    if (currentStep < maxStep) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return timelineName && timelineDescription;
      case 2:
        return events.length > 0;
      case 3:
        return events.every(e => e.description);
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-16 pb-24 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Timeline Editor</h1>
          <p className="text-muted-foreground">Create your timeline in 5 simple steps</p>
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

        {/* Step Content */}
        <Card className="p-6 mb-6">
          {currentStep === 1 && (
            <TimelineInfoStep
            timelineName={timelineName}
            setTimelineName={setTimelineName}
            timelineDescription={timelineDescription}
            setTimelineDescription={setTimelineDescription}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            allowFictional={allowFictional}
            setAllowFictional={setAllowFictional}
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
              onAIGenerate={() => {}}
            />
          )}
          {currentStep === 3 && (
            <EventDetailsStep events={events} setEvents={setEvents} />
          )}
          {currentStep === 4 && (
            <FinalStep 
              events={events}
              setEvents={setEvents}
              imageStyle={imageStyle}
              setImageStyle={setImageStyle}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
            />
          )}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Review & Publish</h2>
              <p className="text-muted-foreground mb-6">
                Review your timeline and publish it when ready.
              </p>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">{timelineName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{timelineDescription}</p>
                  <p className="text-sm">Total events: {events.length}</p>
                </div>
              </div>
            </div>
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
          <Button
            onClick={handleNext}
            disabled={!canProceed() || currentStep === maxStep}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      <BottomMenuBar />
    </div>
  );
};

export default TimelineEditor;
