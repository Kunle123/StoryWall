import TimelineViewer from '@/components/timeline/TimelineViewer';
import { Timeline, Event } from '@/lib/types';

function buildAutoIndustryDemo(): { timeline: Timeline; events: Event[] } {
  const timeline: Timeline = {
    id: 'auto-1',
    title: 'History of the Automobile Industry',
    description: 'Key milestones from the birth of the car to modern EVs.',
    slug: 'auto-industry',
    creator_id: 'guest',
    visualization_type: 'horizontal',
    is_public: true,
    is_collaborative: false,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any;

  const seedMilestones: Array<{ y: number; m?: number; d?: number; t: string; desc?: string }> = [
    { y: 1886, t: 'Patent Motorwagen', desc: 'Karl Benz patents the Motorwagen.' },
    { y: 1908, t: 'Model T', desc: 'Ford introduces the Model T.' },
    { y: 1913, t: 'Moving Assembly Line', desc: 'Ford deploys moving assembly line.' },
    { y: 1934, t: 'Citroën Traction Avant', desc: 'Mass-produced front-wheel drive.' },
    { y: 1938, t: 'Volkswagen Beetle', desc: 'Production begins.' },
    { y: 1955, t: 'Citroën DS', desc: 'Hydropneumatic suspension breakthrough.' },
    { y: 1964, t: 'Ford Mustang', desc: 'Launch of the pony car segment.' },
    { y: 1973, t: 'Oil Crisis', desc: 'Fuel economy becomes critical.' },
    { y: 1989, t: 'Mazda Miata (MX-5)', desc: 'Revives lightweight roadster.' },
    { y: 1997, t: 'Toyota Prius', desc: 'First mass-produced hybrid.' },
    { y: 2008, t: 'Tesla Roadster', desc: 'Lithium-ion EV goes mainstream.' },
    { y: 2012, t: 'Tesla Model S', desc: 'Long-range EV sedan.' },
    { y: 2016, t: 'Autopilot Advances', desc: 'Consumer ADAS becomes common.' },
    { y: 2020, t: 'EV Acceleration', desc: 'Global EV adoption surges.' },
    { y: 2023, t: 'ADAS Regulation', desc: 'Safety and autonomy guidelines mature.' },
  ];

  // Convert seeds to events
  const events: Event[] = seedMilestones.map((s, i) => ({
    id: `seed-${i + 1}`,
    timeline_id: 'auto-1',
    title: s.t,
    description: s.desc,
    date: `${s.y}-${String(s.m ?? 6).padStart(2, '0')}-${String(s.d ?? 15).padStart(2, '0')}`,
    created_at: '',
    updated_at: '',
  }));

  // Add synthetic filler events with varied spacings between 1890 and 2025
  const totalNeeded = 50;
  let currentYear = 1890;
  let idx = 0;
  const usedKeys = new Set(events.map(e => `${e.title}-${e.date}`));
  while (events.length < totalNeeded && currentYear <= 2025) {
    const gap = Math.max(1, Math.min(9, Math.floor(Math.random() * 10))); // 1-9 year gaps
    currentYear += gap;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const title = `Industry development ${idx + 1}`;
    const date = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${title}-${date}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    events.push({
      id: `synth-${idx + 1}`,
      timeline_id: 'auto-1',
      title,
      description: 'Supplier innovation, regulatory change, or notable model.',
      date,
      created_at: '',
      updated_at: '',
    });
    idx += 1;
  }

  // Ensure chronological order for nice layout
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return { timeline, events };
}

export default function DemoPage() {
  const { timeline, events } = buildAutoIndustryDemo();
  return (
    <div>
      <TimelineViewer timeline={timeline} events={events} />
    </div>
  );
}


