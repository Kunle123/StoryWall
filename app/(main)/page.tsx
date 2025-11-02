"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelines, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("Interactive Timeline");
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  
  // Format the centered event date
  const formatSelectedDate = (event: TimelineEvent | null) => {
    if (!event) return undefined;
    
    if (event.day && event.month) {
      return new Date(event.year, event.month - 1, event.day).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (event.month) {
      return new Date(event.year, event.month - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    }
    return event.year.toString();
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
        <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
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
      {events.length > 0 && <SubMenuBar title={timelineTitle} selectedDate={formatSelectedDate(centeredEvent)} />}
      <Toaster />
      <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">No timelines available. Create one to get started!</p>
          </div>
        ) : (
          <Timeline 
            events={events} 
            pixelsPerYear={30} 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
            onCenteredEventChange={setCenteredEvent}
          />
        )}
      </main>
      <BottomMenuBar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default Index;
