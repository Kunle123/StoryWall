"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BarChart3, Loader2, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toTitleCase } from "@/lib/utils/titleCase";

interface StatisticsEvent {
  id: string;
  date?: Date;
  number?: number;
  title: string;
  description?: string;
  data: Record<string, number>; // Metric name -> value
  chartUrl?: string; // Chart image URL
}

interface StatisticsGenerateChartsStepProps {
  events: StatisticsEvent[];
  setEvents: (events: StatisticsEvent[]) => void;
  metrics: string[];
  chartType: string;
  themeColor: string;
  timelineName: string;
}

export const StatisticsGenerateChartsStep = ({
  events,
  setEvents,
  metrics,
  chartType,
  themeColor,
  timelineName,
}: StatisticsGenerateChartsStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Use ref to track latest events to avoid stale closures
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const handleGenerateCharts = async () => {
    if (events.length === 0) {
      toast({
        title: "No Events",
        description: "Please add events with data before generating charts.",
        variant: "destructive",
      });
      return;
    }

    if (metrics.length === 0) {
      toast({
        title: "No Metrics",
        description: "Please define metrics before generating charts.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratingCount(0);
    setTotalEvents(events.length);

    try {
      const response = await fetch('/api/ai/generate-charts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          events: events.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date?.toISOString(),
            number: event.number,
            data: event.data,
          })),
          metrics,
          chartType,
          themeColor,
          timelineName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate charts');
      }

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chart') {
                // Update progress based on completed charts
                setGeneratingCount(data.completed);
                setProgress((data.completed / data.total) * 100);
                
                // Update event with chart URL as soon as it's ready
                if (data.chartUrl && data.index !== undefined) {
                  // Use ref to get latest events to avoid stale closure
                  const currentEvents = eventsRef.current;
                  if (data.index < currentEvents.length) {
                    const eventId = currentEvents[data.index].id;
                    const updatedEvents = currentEvents.map(e =>
                      e.id === eventId ? { ...e, chartUrl: data.chartUrl } : e
                    );
                    setEvents(updatedEvents);
                  }
                }
              } else if (data.type === 'complete') {
                // All charts complete
                toast({
                  title: "Charts Generated",
                  description: `Successfully generated ${data.completed} charts.`,
                });
                setIsGenerating(false);
                setProgress(100);
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Chart generation failed');
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating charts:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate charts. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const eventsWithCharts = events.filter(e => e.chartUrl).length;
  const allChartsGenerated = events.length > 0 && eventsWithCharts === events.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2">Generate Charts</h2>
        <p className="text-muted-foreground">
          Generate visual charts for each event showing the statistical data. Charts will be created as images that can be displayed in your timeline.
        </p>
      </div>

      {/* Generation Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[15px]">Chart Generation</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {events.length} event{events.length !== 1 ? 's' : ''} ready for chart generation
              </p>
            </div>
            <div className="flex items-center gap-2">
              {allChartsGenerated && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All charts generated</span>
                </div>
              )}
              {!allChartsGenerated && (
                <Button
                  onClick={handleGenerateCharts}
                  disabled={isGenerating || events.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Charts... {generatingCount}/{totalEvents}
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Generate Charts
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Generating chart {generatingCount} of {totalEvents} ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {/* Chart Type and Theme Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Chart Type:</span>{' '}
                <span className="font-medium capitalize">{chartType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Theme Color:</span>{' '}
                <span className="font-medium">
                  {themeColor ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border-2 border-current"
                        style={{ backgroundColor: themeColor }}
                      />
                      {themeColor}
                    </span>
                  ) : (
                    'Default'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Events List */}
      {events.length > 0 && (
        <div className="space-y-4">
          <Label className="text-[15px]">
            Events ({eventsWithCharts}/{events.length} with charts)
            {allChartsGenerated && (
              <span className="ml-2 text-sm text-green-600 font-medium">✓ All charts ready</span>
            )}
          </Label>
          <div className="space-y-3">
            {events.map((event, index) => (
              <Card key={event.id} className={`p-4 ${event.chartUrl ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/30'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{toTitleCase(event.title || `Event ${index + 1}`)}</h4>
                      {event.chartUrl ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      )}
                      {!event.chartUrl && (
                        <span className="text-xs text-amber-600 font-medium">Chart pending</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                    {event.date && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {format(event.date, 'PPP')}
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {metrics.map((metric) => (
                        <div key={metric} className="text-sm">
                          <span className="text-muted-foreground">{metric}:</span>{' '}
                          <span className="font-medium">{event.data[metric] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {event.chartUrl && (
                    <div className="ml-4">
                      <img
                        src={event.chartUrl}
                        alt={`Chart for ${event.title}`}
                        className="w-32 h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No events with data available. Please go back to Step 3 to add events with statistical data.
          </p>
        </Card>
      )}
    </div>
  );
};

