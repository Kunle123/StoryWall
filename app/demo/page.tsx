import TimelineViewer from '@/components/timeline/TimelineViewer';
import { Timeline, Event } from '@/lib/types';

export default function DemoPage() {
  const timeline: Timeline = {
    id: 'demo-1',
    title: 'Apollo Program',
    description: 'NASA program that landed humans on the Moon.',
    slug: 'apollo-program',
    creator_id: 'guest',
    visualization_type: 'horizontal',
    is_public: true,
    is_collaborative: false,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any;

  const events: Event[] = [
    { id: 'e1', timeline_id: 'demo-1', title: 'Apollo 8', date: '1968-12-21', description: 'First crewed flight to orbit the Moon.', created_at: '', updated_at: '' },
    { id: 'e2', timeline_id: 'demo-1', title: 'Apollo 11', date: '1969-07-16', end_date: '1969-07-24', description: 'First Moon landing.', created_at: '', updated_at: '' },
    { id: 'e3', timeline_id: 'demo-1', title: 'Apollo 13', date: '1970-04-11', description: 'In-flight emergency; safe return.', created_at: '', updated_at: '' },
    { id: 'e4', timeline_id: 'demo-1', title: 'Apollo 17', date: '1972-12-07', description: 'Last crewed Moon mission of Apollo.', created_at: '', updated_at: '' },
  ];

  return (
    <div>
      <TimelineViewer timeline={timeline} events={events} />
    </div>
  );
}


