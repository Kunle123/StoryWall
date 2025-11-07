import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
            placeholder="e.g., History of Palestine from the British Mandate to present day"
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
            placeholder="e.g., A list of the significant geopolitical events that shaped Palestine since the British mandate"
            value={timelineDescription}
            onChange={(e) => setTimelineDescription(e.target.value)}
            className="min-h-[120px] resize-none"
            rows={5}
          />
          <p className="text-sm text-muted-foreground mt-2">
            AI will generate up to 20 events based on your timeline description
          </p>
        </div>

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
      </div>
    </div>
  );
};

