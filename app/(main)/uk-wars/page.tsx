"use client";

import { useState, useEffect } from "react";
import { Timeline, TimelineEvent } from "@/components/timeline/Timeline";
import { fetchEventsByTimelineId, fetchTimelines, transformApiEventToTimelineEvent } from "@/lib/api/client";
import { Header } from "@/components/layout/Header";
import { SubMenuBar } from "@/components/layout/SubMenuBar";
import { ExperimentalBottomMenuBar } from "@/components/layout/ExperimentalBottomMenuBar";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { formatEventDate } from "@/lib/utils/dateFormat";

const UKWarsPage = () => {
  const [viewMode, setViewMode] = useState<"vertical" | "hybrid">("vertical");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineTitle, setTimelineTitle] = useState("UK Wars & Conflicts Timeline");
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
      {events.length > 0 && <SubMenuBar title={timelineTitle} selectedDate={formatSelectedDate(centeredEvent)} />}
      <Toaster />
      <main className="container mx-auto px-3 pt-[88px] pb-0 max-w-6xl">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Timeline not found. Please seed the database first.</p>
          </div>
        ) : (
          <Timeline 
            events={events} 
            pixelsPerYear={15} 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
            onCenteredEventChange={setCenteredEvent}
          />
        )}
      </main>
      {events.length > 0 && (() => {
        const startDate = events.length > 0 ? new Date(Math.min(...events.map(e => new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime()))) : undefined;
        const endDate = events.length > 0 ? new Date(Math.max(...events.map(e => new Date(e.year, (e.month || 12) - 1, e.day || 31).getTime()))) : undefined;
        const timelinePosition = (() => {
          if (!centeredEvent || events.length < 2) return 0.5;
          const sortedEvts = [...events].sort((a, b) => {
            const dateA = new Date(a.year, (a.month || 1) - 1, a.day || 1).getTime();
            const dateB = new Date(b.year, (b.month || 1) - 1, b.day || 1).getTime();
            return dateA - dateB;
          });
          const eventDate = new Date(centeredEvent.year, (centeredEvent.month || 1) - 1, centeredEvent.day || 1).getTime();
          const idx = sortedEvts.findIndex((e: TimelineEvent) => {
            const eDate = new Date(e.year, (e.month || 1) - 1, e.day || 1).getTime();
            return eDate === eventDate;
          });
          if (idx >= 0 && sortedEvts.length > 1) {
            return idx / (sortedEvts.length - 1);
          }
          if (startDate && endDate && eventDate) {
            const totalSpan = endDate.getTime() - startDate.getTime();
            const position = (eventDate - startDate.getTime()) / totalSpan;
            return Math.min(Math.max(position, 0), 1);
          }
          return 0.5;
        })();
        return (
          <ExperimentalBottomMenuBar
            selectedDate={formatSelectedDate(centeredEvent)}
            timelinePosition={timelinePosition}
            startDate={startDate}
            endDate={endDate}
          />
        );
      })()}
    </div>
  );
};

export default UKWarsPage;

