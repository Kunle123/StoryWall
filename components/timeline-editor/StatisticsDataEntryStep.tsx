"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Database, Plus, X, Loader2, Calendar, Hash } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toTitleCase } from "@/lib/utils/titleCase";

interface StatisticsEvent {
  id: string;
  date?: Date;
  number?: number;
  title: string;
  description?: string;
  narrative?: string; // Detailed explanation of trends, causes, and key contributors
  data: Record<string, number>; // Metric name -> value
  chartUrl?: string; // URL of the generated chart image
}

interface StatisticsDataEntryStepProps {
  dataMode: 'ai' | 'manual';
  metrics: string[];
  events: StatisticsEvent[];
  setEvents: (events: StatisticsEvent[]) => void;
  timelineName: string;
  timelineDescription: string;
  dataSource: string;
  useSequence?: boolean;
  setUseSequence?: (use: boolean) => void;
}

export const StatisticsDataEntryStep = ({
  dataMode = 'ai',
  metrics = [],
  events = [],
  setEvents,
  timelineName = '',
  timelineDescription = '',
  dataSource = '',
  useSequence = false,
  setUseSequence,
}: StatisticsDataEntryStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('auto');

  // Safety check: ensure metrics is an array
  const safeMetrics = Array.isArray(metrics) ? metrics.filter(m => m && m.trim().length > 0) : [];

  const handleGenerateWithAI = async () => {
    if (!timelineName || !timelineDescription || safeMetrics.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please complete previous steps first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const response = await fetch('/api/ai/generate-statistics-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineName,
          timelineDescription,
          metrics: safeMetrics,
          dataSource,
          period: selectedPeriod === 'auto' ? undefined : selectedPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate data');
      }

      const data = await response.json() as {
        events?: Array<{
          id?: string;
          date?: string;
          number?: number;
          title: string;
          description?: string;
          data?: Record<string, number>;
          dataUnavailable?: boolean;
          reason?: string;
        }>;
      };
      
      if (data.events && Array.isArray(data.events)) {
        // Transform API events to StatisticsEvent format
        const transformedEvents: StatisticsEvent[] = data.events.map((event) => {
          // Build description - include reason if data unavailable
          let description = event.description || '';
          if (event.dataUnavailable && event.reason) {
            description = description 
              ? `${description} (${event.reason})`
              : `Data unavailable: ${event.reason}`;
          }
          
          return {
            id: event.id || `event-${Date.now()}-${Math.random()}`,
            date: event.date ? new Date(event.date) : undefined,
            number: event.number,
            title: event.title,
            description: description || undefined,
            narrative: (event as any).narrative || undefined,
            data: event.data || {},
          };
        });
        
        setEvents(transformedEvents);
        toast({
          title: "Data Generated",
          description: `Generated ${transformedEvents.length} events with statistical data.`,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating data:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate data. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleAddEvent = () => {
    const newEvent: StatisticsEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      title: '',
      data: metrics.reduce((acc, metric) => ({ ...acc, [metric]: 0 }), {}),
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleEventChange = (
    eventId: string, 
    field: keyof StatisticsEvent, 
    value: string | Date | number | Record<string, number> | undefined
  ) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, [field]: value } : e
    ));
  };

  const handleDataChange = (eventId: string, metric: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEvents(events.map(e => 
      e.id === eventId 
        ? { ...e, data: { ...e.data, [metric]: numValue } }
        : e
    ));
  };

  const periodOptions = [
    { value: 'auto', label: 'Auto-select based on data availability' },
    { value: 'since-brexit', label: 'Since Brexit (2016)' },
    { value: 'since-2020', label: 'Since 2020' },
    { value: 'since-2010', label: 'Since 2010' },
    { value: 'since-ww2', label: 'Since World War II (1945)' },
    { value: 'last-5-years', label: 'Last 5 Years' },
    { value: 'last-10-years', label: 'Last 10 Years' },
    { value: 'custom', label: 'Custom Period' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2">Enter Data</h2>
        <p className="text-muted-foreground">
          {dataMode === 'ai' 
            ? 'AI will search the data source for real statistical data matching your metrics and create events at significant periods. Only metrics available in the data source will be included.'
            : 'Enter data manually for each event. Each event should have values for all metrics.'}
        </p>
      </div>

      <Tabs defaultValue={dataMode || 'ai'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">Find Data</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[15px]">Time Period (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Select a specific period or let AI choose based on data availability. AI will only use metrics that are available in the data source.
                </p>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Data Source</p>
                  <p className="text-xs text-muted-foreground">{dataSource || 'Not specified'}</p>
                </div>
              </div>

              {events.length === 0 ? (
                <Button
                  id="generate-statistics-data-button"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrieving data and creating events... {generationProgress > 0 && `${generationProgress}%`}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Use AI to Retrieve Data
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✓ Data retrieved successfully ({events.length} events generated)
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    You can review and edit the events below, or click "Clear All" to retrieve new data.
                  </p>
                </div>
              )}

              {isGenerating && generationProgress > 0 && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {generationProgress}% complete
                  </p>
                </div>
              )}
            </div>
          </Card>

          {events.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[15px]">Generated Events ({events.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEvents([])}
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{toTitleCase(event.title || 'Untitled Event')}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {event.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(event.date, 'PPP')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEvent(event.id)}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                      {safeMetrics.map((metric) => (
                        <div key={metric} className="text-sm">
                          <span className="text-muted-foreground">{metric}:</span>{' '}
                          <span className="font-medium">{event.data[metric] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <Label className="text-[15px]">Events ({events.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEvent}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>

          {events.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No events yet. Click "Add Event" to get started.</p>
              <Button onClick={handleAddEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Event
              </Button>
            </Card>
          )}

          <div className="space-y-4">
            {events.map((event, index) => (
              <Card key={event.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">Event {index + 1}</h4>
                    {events.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEvent(event.id)}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Title *</Label>
                      <Input
                        placeholder="e.g., January 2024"
                        value={event.title}
                        onChange={(e) => handleEventChange(event.id, 'title', toTitleCase(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !event.date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {event.date ? format(event.date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={event.date}
                            onSelect={(date) => handleEventChange(event.id, 'date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="Brief description of this event"
                      value={event.description || ''}
                      onChange={(e) => handleEventChange(event.id, 'description', e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Data Values *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {safeMetrics.map((metric) => (
                        <div key={metric} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{metric}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={event.data[metric] ?? ''}
                            onChange={(e) => handleDataChange(event.id, metric, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

