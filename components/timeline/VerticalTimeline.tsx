'use client';

import { Event } from '@/lib/types';
import EventCard from './EventCard';

interface VerticalTimelineProps {
  events: Event[];
}

export default function VerticalTimeline({ events }: VerticalTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedEvents.length === 0) return null;

  const dates = sortedEvents.map(e => new Date(e.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const timeSpan = maxDate - minDate;
  const years = timeSpan / (1000 * 60 * 60 * 24 * 365);
  const pixelsPerYear = Math.max(50, Math.min(200, 3000 / years));

  const eventsWithPositions: { event: Event; topPosition: number }[] = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const eventDate = new Date(event.date).getTime();
    const yearsFromStart = (eventDate - minDate) / (1000 * 60 * 60 * 24 * 365);
    let topPosition = yearsFromStart * pixelsPerYear;

    if (i > 0) {
      const prevPosition = eventsWithPositions[i - 1].topPosition;
      const minGap = 180;
      if (topPosition - prevPosition < minGap) {
        topPosition = prevPosition + minGap;
      }
    }

    eventsWithPositions.push({ event, topPosition });
  }

  const totalHeight = eventsWithPositions[eventsWithPositions.length - 1].topPosition + 200;

  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

      {eventsWithPositions.map(({ event, topPosition }) => (
        <div key={event.id} className="absolute pl-20 w-full" style={{ top: `${topPosition}px` }}>
          <div className="absolute left-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}


