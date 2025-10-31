"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelines, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("Interactive Timeline");
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");

  const formatDateRange = (events: TimelineEvent[]) => {
    if (events.length === 0) return "";
    const sorted = [...events].sort((a, b) => a.year - b.year);
    const startYear = sorted[0].year;
    const endYear = sorted[sorted.length - 1].year;
    return `${startYear} - ${endYear}`;
  };
  
  useEffect(() => {
    // Try to fetch the first public timeline from API
    async function loadTimeline() {
      try {
        setLoading(true);
        const timelinesResult = await fetchTimelines({ limit: 1, is_public: true });
        
        if (timelinesResult.data && timelinesResult.data.length > 0) {
          const timeline = timelinesResult.data[0];
          setTimelineTitle(timeline.title || "Interactive Timeline");
          
          // Fetch events for this timeline
          const eventsResult = await fetchEventsByTimelineId(timeline.id);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
            setLoading(false);
            return;
          }
        }
        
        // No timeline found - show empty state
        setEvents([]);
        setTimelineTitle("Interactive Timeline");
      } catch (error) {
        console.error('Failed to load timeline from API:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadTimeline();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 pt-14 pb-0 max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading timeline...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />
      <main className="container mx-auto px-3 pt-14 pb-0 max-w-6xl">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">No timelines available. Create one to get started!</p>
          </div>
        ) : (
          <Timeline events={events} pixelsPerYear={30} viewMode={viewMode} onViewModeChange={setViewMode} />
        )}
      </main>
      <BottomMenuBar 
        title={timelineTitle} 
        dateRange={formatDateRange(events)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default Index;
