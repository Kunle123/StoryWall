import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Lock, BookOpen, Sparkles } from "lucide-react";

interface TimelineInfoStepProps {
  timelineName: string;
  setTimelineName: (name: string) => void;
  timelineDescription: string;
  setTimelineDescription: (description: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  isFactual: boolean;
  setIsFactual: (isFactual: boolean) => void;
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

        <div className="pt-4 border-t border-border">
          <Label className="text-base mb-3 block">Visibility</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                isPublic
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:border-border/80'
              }`}
            >
              <Globe className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Public</div>
                <div className="text-sm text-muted-foreground">
                  Visible in discover page
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                !isPublic
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:border-border/80'
              }`}
            >
              <Lock className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Private</div>
                <div className="text-sm text-muted-foreground">
                  Only visible to you
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

