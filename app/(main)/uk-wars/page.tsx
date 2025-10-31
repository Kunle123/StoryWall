"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchEventsByTimelineId, fetchTimelines, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { BottomMenuBar } from "@/components/layout/BottomMenuBar";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

const UKWarsPage = () => {
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("UK Wars & Conflicts Timeline");


  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        // Find UK Wars timeline by searching all timelines
        const allTimelines = await fetchTimelines({ limit: 100 });
        const ukTimeline = allTimelines.data?.find(
          (t: any) => t.title.includes('UK Wars') || t.slug === 'uk-wars'
        );
        
        if (ukTimeline) {
          setTimelineTitle(ukTimeline.title);
          const eventsResult = await fetchEventsByTimelineId(ukTimeline.id);
          if (eventsResult.data && eventsResult.data.length > 0) {
            const transformedEvents = eventsResult.data.map(transformApiEventToTimelineEvent);
            setEvents(transformedEvents);
          } else {
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to load UK Wars timeline:', error);
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
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {events.length > 0 && <SubMenuBar title={timelineTitle} />}
      <Toaster />
      <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Timeline not found. Please seed the database first.</p>
          </div>
        ) : (
          <Timeline events={events} pixelsPerYear={15} viewMode={viewMode} onViewModeChange={setViewMode} />
        )}
      </main>
      <BottomMenuBar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default UKWarsPage;

