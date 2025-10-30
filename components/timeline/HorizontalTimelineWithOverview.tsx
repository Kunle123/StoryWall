'use client';

import { useEffect, useMemo, useRef } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Event } from '@/lib/types';

interface Props {
  events: Event[];
}

export default function HorizontalTimelineWithOverview({ events }: Props) {
  const mainRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => {
    if (events.length === 0) return null;
    const times = events.map(e => new Date(e.date).getTime());
    const start = new Date(Math.min(...times));
    const end = new Date(Math.max(...times));
    return { start, end };
  }, [events]);

  useEffect(() => {
    if (!mainRef.current || !miniRef.current || events.length === 0) return;

    const items = events.map(event => ({
      id: event.id,
      content: event.title,
      start: new Date(event.date),
      end: event.end_date ? new Date(event.end_date) : undefined,
      title: event.description || '',
      className: event.category || 'default',
    }));

    const isSmall = typeof window !== 'undefined' && window.innerWidth < 640;
    const mainOptions = {
      width: '100%',
      height: isSmall ? '300px' : '420px',
      margin: { item: isSmall ? 10 : 20 },
      orientation: 'both',
      zoomMin: 1000 * 60 * 60 * 24 * 3,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 200,
    } as any;

    const miniOptions = {
      width: '100%',
      height: isSmall ? '80px' : '100px',
      margin: { item: 4 },
      selectable: false,
      zoomMin: 1000 * 60 * 60 * 24 * 30,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 500,
      moveable: true,
      zoomable: true,
    } as any;

    let cleanup: (() => void) | undefined;
    (async () => {
      const mod = await import('vis-timeline/standalone');

      // Main timeline
      const main = new mod.Timeline(mainRef.current as HTMLDivElement, items as any, mainOptions);

      // Mini timeline with shaded window background item + smaller items
      const miniItems = [
        { id: 'window', type: 'background', start: range?.start, end: range?.end, className: 'overview-window' },
        ...items.map(i => ({ ...i, content: '' })), // dots without labels to keep miniature clean
      ];
      const mini = new mod.Timeline(miniRef.current as HTMLDivElement, miniItems as any, miniOptions);

      if (range) {
        // Fit mini to full span, and set a reasonable initial window on main
        mini.fit({ animation: false } as any);
        main.setWindow(new Date(range.start), new Date(range.end), { animation: false } as any);
      }

      // When main range changes, update shaded window on mini
      const onMainRange = () => {
        const { start, end } = main.getWindow();
        const updated = [
          { id: 'window', type: 'background', start, end, className: 'overview-window' },
          ...items.map(i => ({ ...i, content: '' })),
        ];
        // Reinitialize items to avoid DataSet dependency
        mini.setItems(updated as any);
      };
      main.on('rangechange', onMainRange);
      main.on('rangechanged', onMainRange);

      // When mini pans/zooms, mirror window to main
      const onMiniRange = () => {
        const { start, end } = mini.getWindow();
        main.setWindow(start, end, { animation: false } as any);
      };
      mini.on('rangechange', onMiniRange);
      mini.on('rangechanged', onMiniRange);

      cleanup = () => {
        main.off('rangechange', onMainRange);
        main.off('rangechanged', onMainRange);
        mini.off('rangechange', onMiniRange);
        mini.off('rangechanged', onMiniRange);
        main.destroy();
        mini.destroy();
      };
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [events, range]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={mainRef} className="w-full" />
      <div className="text-xs text-gray-500">
        {range && (
          <span>
            Overview: {range.start.getFullYear()} - {range.end.getFullYear()}
          </span>
        )}
      </div>
      <div ref={miniRef} className="w-full" />
    </div>
  );
}


