"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, LineChart, PieChart, TrendingUp, Info } from "lucide-react";

interface StatisticsChartStyleStepProps {
  chartType: string;
  setChartType: (type: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  metrics: string[];
}

const chartTypes = [
  { 
    value: 'bar', 
    label: 'Bar Chart', 
    icon: BarChart3,
    description: 'Best for comparing values across categories. Shows changes clearly over time.',
    suitableFor: 'Polling data, crime statistics, production numbers'
  },
  { 
    value: 'line', 
    label: 'Line Chart', 
    icon: LineChart,
    description: 'Best for showing trends and changes over time. Smooth transitions between data points.',
    suitableFor: 'Time series data, continuous measurements'
  },
  { 
    value: 'pie', 
    label: 'Pie Chart', 
    icon: PieChart,
    description: 'Best for showing proportions and percentages. Each slice represents a portion of the whole.',
    suitableFor: 'Percentage data, market share, distribution'
  },
  { 
    value: 'doughnut', 
    label: 'Doughnut Chart', 
    icon: PieChart,
    description: 'Similar to pie chart but with a hole in the center. Good for showing proportions with emphasis on individual segments.',
    suitableFor: 'Percentage data with focus on individual metrics'
  },
];

const themeColors = [
  { name: "Storywall Blue", value: "#3B82F6" },
  { name: "Storywall Purple", value: "#A855F7" },
  { name: "Storywall Green", value: "#10B981" },
  { name: "Storywall Orange", value: "#F97316" },
  { name: "Storywall Red", value: "#EF4444" },
  { name: "Storywall Pink", value: "#EC4899" },
  { name: "Storywall Teal", value: "#14B8A6" },
  { name: "Storywall Yellow", value: "#EAB308" },
];

export const StatisticsChartStyleStep = ({
  chartType,
  setChartType,
  themeColor,
  setThemeColor,
  metrics,
}: StatisticsChartStyleStepProps) => {
  // Set default to bar chart if not set
  if (!chartType) {
    setChartType('bar');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2">Choose Chart Style</h2>
        <p className="text-muted-foreground">
          Select the chart type that best represents your data. The chart will animate as you move through events.
        </p>
      </div>

      {/* Chart Type Selection */}
      <div className="space-y-4">
        <Label className="text-[15px]">Chart Type *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartTypes.map((chart) => {
            const Icon = chart.icon;
            const isSelected = chartType === chart.value;
            
            return (
              <Card
                key={chart.value}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setChartType(chart.value)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{chart.label}</span>
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {chart.description}
                    </p>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Best for: {chart.suitableFor}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Theme Color Selection */}
      <div className="space-y-4">
        <Label className="text-[15px]">Chart Color Theme (Optional)</Label>
        <p className="text-xs text-muted-foreground">
          Choose a color theme for your charts. Each metric will use variations of this color for consistency.
        </p>
        <div className="flex flex-wrap gap-2">
          {themeColors.map((color) => {
            const isSelected = themeColor === color.value;
            return (
              <Button
                key={color.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="gap-2"
                onClick={() => setThemeColor(isSelected ? '' : color.value)}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-current"
                  style={{ backgroundColor: color.value }}
                />
                {color.name}
              </Button>
            );
          })}
        </div>
        {themeColor && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium" style={{ color: themeColor }}>
                {themeColors.find(c => c.value === themeColor)?.name}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Metrics Preview */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <Label className="text-sm font-semibold mb-2 block">Metrics to Display</Label>
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
          These {metrics.length} metric{metrics.length !== 1 ? 's' : ''} will be displayed on your {chartTypes.find(c => c.value === chartType)?.label.toLowerCase() || 'chart'}.
        </p>
      </div>
    </div>
  );
};

