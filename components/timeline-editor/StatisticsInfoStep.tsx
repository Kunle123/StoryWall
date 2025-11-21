"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Sparkles } from "lucide-react";
import { useState } from "react";
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
  onGenerateSuggestions,
}: StatisticsInfoStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateSuggestions = async () => {
    if (!timelineDescription.trim()) {
      toast({
        title: "Missing description",
        description: "Please provide a timeline description first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-statistics-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineName,
          timelineDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      if (data.metrics && Array.isArray(data.metrics)) {
        setMetrics(data.metrics.slice(0, 8)); // Limit to 8 metrics
        toast({
          title: "Suggestions generated",
          description: `Generated ${data.metrics.length} metric suggestions.`,
        });
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || !timelineDescription.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Suggest Metrics
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Define up to 8 metrics you want to track (e.g., "Conservative Party", "Labour Party", "Lib Dem"). 
          These will remain consistent across all events.
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

