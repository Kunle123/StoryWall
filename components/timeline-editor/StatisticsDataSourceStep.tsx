"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Database, Info } from "lucide-react";

interface StatisticsDataSourceStepProps {
  dataMode: 'ai' | 'manual';
  setDataMode: (mode: 'ai' | 'manual') => void;
  dataSource: string;
  setDataSource: (source: string) => void;
  metrics: string[];
  timelineName: string;
  timelineDescription: string;
}

export const StatisticsDataSourceStep = ({
  dataMode,
  setDataMode,
  dataSource,
  setDataSource,
  metrics,
  timelineName,
  timelineDescription,
}: StatisticsDataSourceStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2">Choose Data Source</h2>
        <p className="text-muted-foreground">
          Select how you want to populate the data for your statistics timeline.
        </p>
      </div>

      {/* Data Mode Selection */}
      <div className="space-y-4">
        <Label className="text-[15px]">How would you like to get the data? *</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              dataMode === 'ai' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => setDataMode('ai')}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                dataMode === 'ai' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {dataMode === 'ai' && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Find Data from Sources</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI will search for real statistical data from official sources. Only metrics available in the data source will be used.
                </p>
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>AI will find historical data points from the specified source and create events at significant periods based on data availability.</span>
                </div>
              </div>
            </div>
          </Card>

          <Card 
            className={`p-4 cursor-pointer transition-all ${
              dataMode === 'manual' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => setDataMode('manual')}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                dataMode === 'manual' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {dataMode === 'manual' && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4" />
                  <span className="font-semibold">Manual Entry</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter data manually for each event. You'll have full control over the values and dates.
                </p>
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>You can import from spreadsheets or enter data point by point.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Data Source Input */}
      <div className="space-y-2">
        <Label htmlFor="data-source" className="text-[15px]">
          Data Source {dataMode === 'ai' ? '(AI Suggested)' : '(Optional)'}
        </Label>
        <p className="text-xs text-muted-foreground">
          {dataMode === 'ai' 
            ? 'This is the suggested data source. AI will search this source for real data matching your metrics. You can edit it if needed. Only metrics available in this source will be used.'
            : 'Specify where your data comes from (e.g., "Office for National Statistics", "Police.uk"). This will be displayed on charts.'}
        </p>
        <Input
          id="data-source"
          placeholder="e.g., Office for National Statistics, Police.uk - Crime Statistics"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Metrics Summary */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <Label className="text-sm font-semibold mb-2 block">Metrics to Track</Label>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-background border rounded-md"
            >
              {metric}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          These {metrics.length} metric{metrics.length !== 1 ? 's' : ''} will be tracked across all events.
        </p>
      </div>
    </div>
  );
};

