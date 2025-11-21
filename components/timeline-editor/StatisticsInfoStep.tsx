"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatisticsInfoStepProps {
  timelineName: string;
  setTimelineName: (name: string) => void;
  timelineDescription: string;
  setTimelineDescription: (description: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  metrics: string[];
  setMetrics: (metrics: string[]) => void;
  onGenerateSuggestions?: () => void;
}

export const StatisticsInfoStep = ({
  timelineName,
  setTimelineName,
  timelineDescription,
  setTimelineDescription,
  isPublic,
  setIsPublic,
  metrics,
  setMetrics,
}: StatisticsInfoStepProps) => {
  const { toast } = useToast();

  const handleAddMetric = () => {
    if (metrics.length >= 8) {
      toast({
        title: "Maximum metrics reached",
        description: "You can add up to 8 metrics per timeline.",
        variant: "destructive",
      });
      return;
    }
    setMetrics([...metrics, ""]);
  };

  const handleRemoveMetric = (index: number) => {
    if (metrics.length > 1) {
      setMetrics(metrics.filter((_, i) => i !== index));
    }
  };

  const handleMetricChange = (index: number, value: string) => {
    const newMetrics = [...metrics];
    newMetrics[index] = value;
    setMetrics(newMetrics);
  };

  // Metrics are already generated from the statistics page, so we just show them here
  // User can still edit them if needed

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2">Define Your Statistics Timeline</h2>
        <p className="text-muted-foreground">
          Specify what you're measuring and define the metrics you want to track over time.
        </p>
      </div>

      {/* Timeline Name */}
      <div className="space-y-2">
        <Label htmlFor="timeline-name" className="text-[15px]">Timeline Title *</Label>
        <Input
          id="timeline-name"
          placeholder="e.g., UK Political Party Polling 2020-2024"
          value={timelineName}
          onChange={(e) => setTimelineName(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Timeline Description */}
      <div className="space-y-2">
        <Label htmlFor="timeline-description" className="text-[15px]">Timeline Description *</Label>
        <Textarea
          id="timeline-description"
          placeholder="e.g., A statistical analysis of UK political party polling data from 2020 to 2024, tracking changes in public opinion across major parties."
          value={timelineDescription}
          onChange={(e) => setTimelineDescription(e.target.value)}
          className="min-h-[100px] resize-none"
          rows={4}
        />
      </div>

      {/* Metrics Definition */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[15px]">Metrics to Track *</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          These metrics will remain consistent across all events. You can edit them if needed.
        </p>
        
        {metrics.map((metric, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Metric ${index + 1} (e.g., Conservative Party)`}
              value={metric}
              onChange={(e) => handleMetricChange(index, e.target.value)}
              className="h-10"
            />
            {metrics.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveMetric(index)}
                className="h-10 w-10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        {metrics.length < 8 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMetric}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Metric
          </Button>
        )}
      </div>

      {/* Public/Private Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="is-public" className="text-[15px]">Public Timeline</Label>
          <p className="text-xs text-muted-foreground">
            Allow others to discover and view this timeline
          </p>
        </div>
        <Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

