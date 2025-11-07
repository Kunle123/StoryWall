import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineInfoStepProps {
  timelineName: string;
  setTimelineName: (name: string) => void;
  timelineDescription: string;
  setTimelineDescription: (description: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  isFactual: boolean;
  setIsFactual: (isFactual: boolean) => void;
  startDate?: Date;
  setStartDate?: (date?: Date) => void;
  endDate?: Date;
  setEndDate?: (date?: Date) => void;
  isNumbered?: boolean;
  setIsNumbered?: (isNumbered: boolean) => void;
  numberLabel?: string;
  setNumberLabel?: (label: string) => void;
  maxEvents?: number;
  setMaxEvents?: (maxEvents: number) => void;
}

export const TimelineInfoStep = ({
  timelineName,
  setTimelineName,
  timelineDescription,
  setTimelineDescription,
  isPublic,
  setIsPublic,
  isFactual,
  setIsFactual,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isNumbered = false,
  setIsNumbered,
  numberLabel = "Day",
  setNumberLabel,
  maxEvents = 20,
  setMaxEvents,
}: TimelineInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-4">
          Step 1: Timeline Information
        </h2>
        <p className="text-muted-foreground mb-6">
          Provide basic information about your timeline
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="timeline-name" className="text-base mb-2 block">
            Timeline Name
          </Label>
          <Input
            id="timeline-name"
            placeholder="e.g., The Great British Bake Off Winners Journey"
            value={timelineName}
            onChange={(e) => setTimelineName(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="timeline-description" className="text-base mb-2 block">
            Description
          </Label>
          <Textarea
            id="timeline-description"
            placeholder="e.g., A timeline of all the winners, memorable moments, and show-stopping bakes from the iconic baking competition"
            value={timelineDescription}
            onChange={(e) => setTimelineDescription(e.target.value)}
            className="min-h-[120px] resize-none"
            rows={5}
          />
          <div className="mt-2 space-y-2">
            {maxEvents <= 20 ? (
              <p className="text-sm text-muted-foreground">
                AI will generate up to 20 events based on your timeline description
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                For &gt; 20 events, enter the max number here. (If using AI, additional images will require 0.5 credits each)
              </p>
            )}
            {setMaxEvents && (
              <div className="flex items-center gap-2">
                <Label htmlFor="max-events" className="text-sm">
                  Max Events:
                </Label>
                <Input
                  id="max-events"
                  type="number"
                  min="1"
                  max="100"
                  value={maxEvents}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 100) {
                      setMaxEvents(value);
                    }
                  }}
                  className="h-9 w-24"
                />
                <span className="text-xs text-muted-foreground">
                  (max 100)
                </span>
              </div>
            )}
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="more-options">
            <AccordionTrigger>More Options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-fictional" className="text-base">
                      Allow Fictional Information
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI to use fictional or creative content when generating timeline events
                    </p>
                  </div>
                  <Switch
                    id="allow-fictional"
                    checked={!isFactual}
                    onCheckedChange={(checked) => setIsFactual(!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-private" className="text-base">
                      Private Timeline
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Make this timeline private (only visible to you)
                    </p>
                  </div>
                  <Switch
                    id="is-private"
                    checked={!isPublic}
                    onCheckedChange={(checked) => setIsPublic(!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="is-numbered" className="text-base">
                      Numbered Events
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use sequential numbering instead of dates (e.g., "12 Days of Christmas")
                    </p>
                    {isNumbered && setIsNumbered && setNumberLabel && (
                      <div className="mt-3">
                        <Label htmlFor="number-label" className="text-sm mb-1 block">
                          Event Label
                        </Label>
                        <Input
                          id="number-label"
                          placeholder="Day, Event, Step, etc."
                          value={numberLabel}
                          onChange={(e) => setNumberLabel(e.target.value)}
                          className="h-9 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Events will be labeled as "{numberLabel} 1", "{numberLabel} 2", etc.
                        </p>
                      </div>
                    )}
                  </div>
                  <Switch
                    id="is-numbered"
                    checked={isNumbered}
                    onCheckedChange={(checked) => setIsNumbered?.(checked)}
                    disabled={!setIsNumbered}
                  />
                </div>

                {!isNumbered && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date" className="text-base mb-2 block">
                        Start Date (Optional)
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="end-date" className="text-base mb-2 block">
                        End Date (Optional)
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => startDate ? date < startDate : false}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

