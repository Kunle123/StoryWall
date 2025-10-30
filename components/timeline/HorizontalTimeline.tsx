'use client';

import { useEffect, useRef } from 'react';
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

    const isSmall = typeof window !== 'undefined' && window.innerWidth < 640;
    const options = {
      width: '100%',
      height: isSmall ? '300px' : '420px',
      margin: { item: isSmall ? 10 : 20 },
      orientation: 'both',
      zoomMin: 1000 * 60 * 60 * 24 * 3,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,
    } as any;

    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const mod = await import('vis-timeline/standalone');
        const timeline = new mod.Timeline(timelineRef.current as HTMLDivElement, items as any, options);
        cleanup = () => timeline.destroy();
      } catch (e) {
        // noop: avoid crashing client if library fails to load
        // Consider logging to an error service in prod
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [events]);

  return (
    <div>
      <div ref={timelineRef} className="w-full" />
    </div>
  );
}


