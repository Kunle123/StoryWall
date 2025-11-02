import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface TimelineInfoStepProps {
  timelineName: string;
  setTimelineName: (name: string) => void;
  timelineDescription: string;
  setTimelineDescription: (description: string) => void;
}

export const TimelineInfoStep = ({
  timelineName,
  setTimelineName,
  timelineDescription,
  setTimelineDescription,
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
      </div>
    </div>
  );
};

