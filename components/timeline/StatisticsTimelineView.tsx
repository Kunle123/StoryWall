"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Table2, BarChart3 } from "lucide-react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { TimelineEvent } from "./Timeline";

// Register Chart.js components (v3 API)
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsData {
  metrics: string[];
  data: Record<string, number>;
  chartType: string;
}

interface StatisticsEvent extends TimelineEvent {
  statisticsData?: StatisticsData;
  year?: number;
}

interface StatisticsTimelineViewProps {
  events: TimelineEvent[];
}

/**
 * Get color for a metric based on common conventions
 */
function getMetricColor(metric: string): string {
  const metricLower = metric.toLowerCase();
  
  // UK Political Parties
  if (metricLower.includes('conservative') || metricLower.includes('tory')) {
    return '#0087DC'; // Conservative blue
  }
  if (metricLower.includes('labour')) {
    return '#E4003B'; // Labour red
  }
  if (metricLower.includes('liberal democrat') || metricLower.includes('lib dem')) {
    return '#FDBB30'; // Lib Dem yellow
  }
  if (metricLower.includes('green')) {
    return '#6AB023'; // Green Party green
  }
  if (metricLower.includes('reform') || metricLower.includes('ukip')) {
    return '#6D2E5B'; // Reform/UKIP purple
  }
  if (metricLower.includes('scottish national') || metricLower.includes('snp')) {
    return '#FDF38E'; // SNP yellow
  }
  if (metricLower.includes('plaid cymru')) {
    return '#3F8428'; // Plaid Cymru green
  }
  
  // Default color palette for other metrics
  const defaultColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  
  // Use a simple hash to consistently assign colors
  let hash = 0;
  for (let i = 0; i < metric.length; i++) {
    hash = metric.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
}

/**
 * Parse statistics data from event description
 */
function parseStatisticsData(description?: string): StatisticsData | null {
  if (!description) return null;
  
  const match = description.match(/\[STATS_DATA:(.+?)\]/);
  if (!match) return null;
  
  try {
    const data = JSON.parse(match[1]);
    return data;
  } catch (e) {
    console.error('Failed to parse statistics data:', e);
    return null;
  }
}

export function StatisticsTimelineView({ events }: StatisticsTimelineViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Parse statistics events
  const statisticsEvents: StatisticsEvent[] = events
    .map(event => {
      const statsData = parseStatisticsData(event.description);
      if (!statsData) return null;
      
      // Extract year from date or title
      let year: number | undefined;
      if (event.year) {
        year = event.year;
      } else if (event.title) {
        const yearMatch = event.title.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      return {
        ...event,
        statisticsData: statsData,
        year,
      } as StatisticsEvent;
    })
    .filter((e): e is StatisticsEvent => e !== null && !e.description?.includes('dataUnavailable'))
    .sort((a, b) => {
      // Sort by year if available
      if (a.year && b.year) {
        return a.year - b.year;
      }
      // Otherwise sort by date (using year, month, day)
      if (a.year && b.year) {
        const dateA = new Date(a.year, (a.month || 1) - 1, a.day || 1);
        const dateB = new Date(b.year, (b.month || 1) - 1, b.day || 1);
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });

  if (statisticsEvents.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No statistics data available</p>
      </div>
    );
  }

  // Get metrics from first event (they should be consistent across all events)
  const metrics = statisticsEvents[0]?.statisticsData?.metrics || [];
  
  const currentEvent = statisticsEvents[currentIndex];
  const statsData = currentEvent.statisticsData!;
  const data = statsData.data || {};

  // Prepare chart data - use useMemo to ensure proper updates
  const chartData = useMemo(() => ({
    labels: metrics,
    datasets: [
      {
        label: currentEvent.title,
        data: metrics.map(metric => data[metric] || 0),
        backgroundColor: metrics.map(metric => getMetricColor(metric)),
        borderColor: metrics.map(metric => getMetricColor(metric)),
        borderWidth: 1,
      },
    ],
  }), [currentIndex, currentEvent.title, data, metrics]);

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: currentEvent.title,
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: 20,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Handle horizontal scroll for details card
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const newIndex = Math.round(scrollLeft / containerWidth);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < statisticsEvents.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * containerWidth,
        behavior: 'smooth',
      });
    }
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < statisticsEvents.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  // Sync scroll position when currentIndex changes programmatically
  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const targetScroll = currentIndex * containerWidth;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      
      // Only scroll if we're significantly off (to avoid fighting with user scroll)
      if (Math.abs(targetScroll - currentScroll) > 10) {
        scrollContainerRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        });
      }
    }
  }, [currentIndex]);

  return (
    <div className="w-full space-y-4">
      {/* Top Card - Chart */}
      <Card 
        ref={cardRef}
        className="p-6 relative overflow-hidden cursor-pointer"
        style={{ minHeight: '400px', perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="relative w-full h-[400px]" style={{ transformStyle: 'preserve-3d' }}>
          <div 
            className={`absolute inset-0 transition-transform duration-500 ${
              isFlipped ? 'rotate-y-180 opacity-0' : 'opacity-100'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <Bar key={currentIndex} data={chartData} options={chartOptions} />
          </div>
          <div 
            className={`absolute inset-0 transition-transform duration-500 ${
              isFlipped ? 'opacity-100' : 'opacity-0 rotate-y-180'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            }}
          >
            <div className="h-full overflow-auto">
              <h3 className="text-lg font-semibold mb-4">Tabulated Data</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Metric</th>
                    <th className="text-right p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => (
                    <tr key={metric} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="p-2">{metric}</td>
                      <td className="text-right p-2 font-medium">{data[metric] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            {isFlipped ? <BarChart3 className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {/* Bottom Card - Scrollable Details */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Event Details</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {statisticsEvents.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === statisticsEvents.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          onScroll={handleScroll}
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex gap-4">
            {statisticsEvents.map((event, index) => (
              <div
                key={event.id}
                className="flex-shrink-0 p-4 bg-muted/30 rounded-lg snap-start"
                style={{
                  minWidth: 'calc(100vw - 2rem)',
                  maxWidth: 'calc(100vw - 2rem)',
                }}
              >
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">{event.title}</h4>
                  {event.year && (
                    <p className="text-sm text-muted-foreground">Year: {event.year}</p>
                  )}
                  {event.description && !event.description.includes('[STATS_DATA:') && (
                    <p className="text-sm">{event.description.replace(/\[STATS_DATA:.+?\]/, '').trim()}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {metrics.map((metric) => (
                      <div key={metric} className="text-sm">
                        <span className="text-muted-foreground">{metric}:</span>{' '}
                        <span className="font-medium">{event.statisticsData?.data[metric] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

