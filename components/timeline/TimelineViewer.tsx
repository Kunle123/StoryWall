'use client';

import { useEffect, useState } from 'react';
import { Timeline as TimelineType, Event } from '@/lib/types';
import HorizontalTimeline from './HorizontalTimeline';
import VerticalTimeline from './VerticalTimeline';
import CardGridTimeline from './CardGridTimeline';

interface TimelineViewerProps {
  timeline: TimelineType;
  events: Event[];
  isEditable?: boolean;
}

export default function TimelineViewer({ timeline, events, isEditable = false }: TimelineViewerProps) {
  const [viewType, setViewType] = useState(timeline.visualization_type);

  // Prefer vertical on small screens by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setViewType('vertical');
    }
    // No deps: run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderTimeline = () => {
    switch (viewType) {
      case 'horizontal':
        return <HorizontalTimeline events={events} />;
      case 'vertical':
        return <VerticalTimeline events={events} />;
      case 'grid':
        return <CardGridTimeline events={events} />;
      default:
        return <HorizontalTimeline events={events} />;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{timeline.title}</h1>
        {timeline.description && (
          <p className="text-gray-600">{timeline.description}</p>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewType('horizontal')}
          className={`px-4 py-2 rounded ${
            viewType === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Horizontal
        </button>
        <button
          onClick={() => setViewType('vertical')}
          className={`px-4 py-2 rounded ${
            viewType === 'vertical' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Vertical
        </button>
        <button
          onClick={() => setViewType('grid')}
          className={`px-4 py-2 rounded ${
            viewType === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Grid
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderTimeline()}
      </div>
    </div>
  );
}


