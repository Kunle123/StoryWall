"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchTimelineById, fetchEventsByTimelineId, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Toaster } from "@/components/ui/toaster";
import { formatEventDate } from "@/lib/utils/dateFormat";
import { CommentsSection } from "@/components/timeline/CommentsSection";

const TimelinePage = () => {
  const params = useParams();
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<any>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [centeredEvent, setCenteredEvent] = useState<TimelineEvent | null>(null);
  
  // Format the centered event date
  const formatSelectedDate = (event: TimelineEvent | null) => {
    if (!event) return undefined;
    return formatEventDate(event.year, event.month, event.day);
  };


  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        setError(null);
        
        // Try API first - fetchTimelineById handles both UUID and slug
        const timelineResult = await fetchTimelineById(timelineId);
        
        if (timelineResult.data) {
          setTimeline(timelineResult.data);
          
          // Use the timeline ID (not the slug) for fetching events
          const eventsTimelineId = timelineResult.data.id || timelineId;
          const eventsResult = await fetchEventsByTimelineId(eventsTimelineId);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
          } else {
            setEvents([]);
          }
        } else {
          setError('Timeline not found');
        }
      } catch (err) {
        console.error('Failed to load timeline:', err);
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    }
    
    if (timelineId) {
      loadTimeline();
    }
  }, [timelineId]);

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

  if (error || !timeline) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Timeline Not Found</h2>
            <p className="text-muted-foreground">{error || "This timeline does not exist."}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubMenuBar title={timeline.title} selectedDate={formatSelectedDate(centeredEvent)} />
      <Toaster />
      <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
        <Timeline 
          events={events.length > 0 ? events : timeline.events || []} 
          pixelsPerYear={30} 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCenteredEventChange={setCenteredEvent}
        />
        <div className="mt-12 pb-8">
          <CommentsSection timelineId={timeline.id || timelineId} />
        </div>
      </main>
      <BottomMenuBar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default TimelinePage;

