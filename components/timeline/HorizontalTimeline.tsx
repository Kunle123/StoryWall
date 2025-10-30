'use client';

import { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Event } from '@/lib/types';

interface HorizontalTimelineProps {
  events: Event[];
}

export default function HorizontalTimeline({ events }: HorizontalTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!timelineRef.current || events.length === 0) return;

    const items = events.map(event => ({
      id: event.id,
      content: event.title,
      start: new Date(event.date),
      end: event.end_date ? new Date(event.end_date) : undefined,
      title: event.description || '',
      className: event.category || 'default',
    }));

    const options = {
      width: '100%',
      height: '400px',
      margin: { item: 20 },
      orientation: 'both',
      zoomMin: 1000 * 60 * 60 * 24 * 7,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,
    } as any;

    const timeline = new Timeline(timelineRef.current, items as any, options);
    return () => {
      timeline.destroy();
    };
  }, [events]);

  return (
    <div>
      <div ref={timelineRef} className="w-full" />
    </div>
  );
}


