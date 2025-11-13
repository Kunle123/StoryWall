lets not set up auth yet unless  you think we need to we don't want the complecity of sign in when we are debugging
# StoryWall MVP - Technical Design Specification for Cursor

## Project Overview

**Name:** StoryWall
**Description:** Collaborative timeline platform - "Wikipedia for timelines"
**MVP Goal:** Allow users to create, view, and collaborate on visual timelines
**Timeline:** 2-3 weeks to MVP

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Railway)
- **Auth:** Clerk
- **Styling:** Tailwind CSS
- **Timeline Visualization:** vis-timeline library + custom components
- **Hosting:** Railway
- **File Storage:** Cloudinary or Railway Volumes

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `timelines`
```sql
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visualization_type VARCHAR(50) DEFAULT 'horizontal',
  is_public BOOLEAN DEFAULT true,
  is_collaborative BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timelines_slug ON timelines(slug);
CREATE INDEX idx_timelines_creator ON timelines(creator_id);
CREATE INDEX idx_timelines_public ON timelines(is_public);
```

#### `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  image_url TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name VARCHAR(255),
  category VARCHAR(100),
  links TEXT[], -- Array of URLs
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_timeline ON events(timeline_id);
CREATE INDEX idx_events_date ON events(date);
```

#### `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_timeline ON categories(timeline_id);
```

#### `collaborators`
```sql
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'editor', -- 'editor' or 'viewer'
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(timeline_id, user_id)
);

CREATE INDEX idx_collaborators_timeline ON collaborators(timeline_id);
CREATE INDEX idx_collaborators_user ON collaborators(user_id);
```

---

## File Structure

```
storywall/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (main)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── create/page.tsx             # Create timeline
│   │   ├── timeline/[slug]/
│   │   │   ├── page.tsx                # View timeline
│   │   │   └── edit/page.tsx           # Edit timeline
│   │   ├── explore/page.tsx            # Browse timelines
│   │   └── profile/[username]/page.tsx # User profile
│   ├── api/
│   │   ├── timelines/
│   │   │   ├── route.ts                # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PATCH, DELETE
│   │   │       └── events/route.ts     # GET, POST events
│   │   └── events/[id]/route.ts        # PATCH, DELETE event
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── timeline/
│   │   ├── HorizontalTimeline.tsx
│   │   ├── VerticalTimeline.tsx
│   │   ├── CardGridTimeline.tsx
│   │   ├── TimelineViewer.tsx          # Main viewer component
│   │   └── EventCard.tsx
│   ├── editor/
│   │   ├── TimelineEditor.tsx
│   │   ├── EventForm.tsx
│   │   └── CategoryManager.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── db/
│   │   ├── supabase.ts                 # Supabase client
│   │   ├── timelines.ts                # Timeline queries
│   │   └── events.ts                   # Event queries
│   ├── utils/
│   │   ├── slugify.ts
│   │   ├── dateFormat.ts
│   │   └── validation.ts
│   └── types/
│       └── index.ts                    # TypeScript types
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## TypeScript Types

```typescript
// lib/types/index.ts

export interface User {
  id: string;
  clerk_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Timeline {
  id: string;
  title: string;
  description?: string;
  slug: string;
  creator_id: string;
  creator?: User;
  visualization_type: VisualizationType;
  is_public: boolean;
  is_collaborative: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  events?: Event[];
  categories?: Category[];
}

export interface Event {
  id: string;
  timeline_id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  end_date?: string;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  category?: string;
  links?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  timeline_id: string;
  name: string;
  color: string; // Hex color
  created_at: string;
}

export interface Collaborator {
  id: string;
  timeline_id: string;
  user_id: string;
  user?: User;
  role: 'editor' | 'viewer';
  added_at: string;
}

export type VisualizationType = 'horizontal' | 'vertical' | 'grid';

export interface CreateTimelineInput {
  title: string;
  description?: string;
  visualization_type?: VisualizationType;
  is_public?: boolean;
  is_collaborative?: boolean;
}

export interface CreateEventInput {
  timeline_id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  category?: string;
  links?: string[];
}
```

---

## Key Components

### 1. Homepage (`app/(main)/page.tsx`)

```typescript
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getFeaturedTimelines } from '@/lib/db/timelines';

export default async function HomePage() {
  const featuredTimelines = await getFeaturedTimelines(6);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Create Beautiful Timelines for Anything
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The collaborative platform for visual storytelling through time
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/create">
              <Button size="lg">Create Timeline</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg">Explore Timelines</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Timelines */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTimelines.map((timeline) => (
              <TimelineCard key={timeline.id} timeline={timeline} />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Perfect For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <UseCaseCard 
              icon="📚" 
              title="Education" 
              description="History lessons, project timelines"
            />
            <UseCaseCard 
              icon="🏢" 
              title="Business" 
              description="Company history, product roadmaps"
            />
            <UseCaseCard 
              icon="🎬" 
              title="Entertainment" 
              description="Movie franchises, band discographies"
            />
            <UseCaseCard 
              icon="✈️" 
              title="Travel" 
              description="Trip itineraries, historical tours"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
```

### 2. Timeline Viewer (`components/timeline/TimelineViewer.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Timeline, Event } from '@/lib/types';
import HorizontalTimeline from './HorizontalTimeline';
import VerticalTimeline from './VerticalTimeline';
import CardGridTimeline from './CardGridTimeline';

interface TimelineViewerProps {
  timeline: Timeline;
  events: Event[];
  isEditable?: boolean;
}

export default function TimelineViewer({ 
  timeline, 
  events,
  isEditable = false 
}: TimelineViewerProps) {
  const [viewType, setViewType] = useState(timeline.visualization_type);

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{timeline.title}</h1>
        {timeline.description && (
          <p className="text-gray-600">{timeline.description}</p>
        )}
      </div>

      {/* View Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewType('horizontal')}
          className={`px-4 py-2 rounded ${
            viewType === 'horizontal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200'
          }`}
        >
          Horizontal
        </button>
        <button
          onClick={() => setViewType('vertical')}
          className={`px-4 py-2 rounded ${
            viewType === 'vertical' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200'
          }`}
        >
          Vertical
        </button>
        <button
          onClick={() => setViewType('grid')}
          className={`px-4 py-2 rounded ${
            viewType === 'grid' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200'
          }`}
        >
          Grid
        </button>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderTimeline()}
      </div>
    </div>
  );
}
```

### 3. Horizontal Timeline (`components/timeline/HorizontalTimeline.tsx`)

```typescript
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

    // Convert events to vis-timeline format
    const items = events.map(event => ({
      id: event.id,
      content: event.title,
      start: new Date(event.date),
      end: event.end_date ? new Date(event.end_date) : undefined,
      title: event.description || '',
      className: event.category || 'default',
    }));

    // Timeline options
    const options = {
      width: '100%',
      height: '400px',
      margin: {
        item: 20,
      },
      orientation: 'both',
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 week
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 100, // 100 years
    };

    // Create timeline
    const timeline = new Timeline(timelineRef.current, items, options);

    // Cleanup
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
```

### 4. Vertical Timeline (`components/timeline/VerticalTimeline.tsx`)

```typescript
'use client';

import { Event } from '@/lib/types';
import EventCard from './EventCard';

interface VerticalTimelineProps {
  events: Event[];
}

export default function VerticalTimeline({ events }: VerticalTimelineProps) {
  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedEvents.length === 0) return null;

  // Calculate optimal scale for proportional spacing
  const dates = sortedEvents.map(e => new Date(e.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const timeSpan = maxDate - minDate;
  const years = timeSpan / (1000 * 60 * 60 * 24 * 365);
  const pixelsPerYear = Math.max(50, Math.min(200, 3000 / years));

  // Calculate positions with proportional spacing and minimum gap enforcement
  const eventsWithPositions = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const eventDate = new Date(event.date).getTime();
    const yearsFromStart = (eventDate - minDate) / (1000 * 60 * 60 * 24 * 365);
    let topPosition = yearsFromStart * pixelsPerYear;
    
    // Enforce minimum gap to prevent overlapping
    if (i > 0) {
      const prevPosition = eventsWithPositions[i - 1].topPosition;
      const minGap = 180; // Minimum pixels between events
      if (topPosition - prevPosition < minGap) {
        topPosition = prevPosition + minGap;
      }
    }
    
    eventsWithPositions.push({ event, topPosition });
  }

  const totalHeight = eventsWithPositions[eventsWithPositions.length - 1].topPosition + 200;

  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* Vertical line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

      {/* Events with proportional spacing */}
      {eventsWithPositions.map(({ event, topPosition }) => (
        <div 
          key={event.id} 
          className="absolute pl-20 w-full"
          style={{ top: `${topPosition}px` }}
        >
          {/* Dot */}
          <div className="absolute left-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />
          
          {/* Event card */}
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}
```

### 5. Event Card (`components/timeline/EventCard.tsx`)

```typescript
import { Event } from '@/lib/types';
import { formatDate } from '@/lib/utils/dateFormat';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* Image */}
      {event.image_url && (
        <img 
          src={event.image_url} 
          alt={event.title}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}

      {/* Date */}
      <div className="text-sm text-gray-500 mb-2">
        {formatDate(event.date)}
        {event.end_date && ` - ${formatDate(event.end_date)}`}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold mb-2">{event.title}</h3>

      {/* Description */}
      {event.description && (
        <p className="text-gray-700 mb-4">{event.description}</p>
      )}

      {/* Location */}
      {event.location_name && (
        <div className="text-sm text-gray-600 mb-2">
          📍 {event.location_name}
        </div>
      )}

      {/* Links */}
      {event.links && event.links.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {event.links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Link {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## API Routes

### Create Timeline (`app/api/timelines/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createTimeline } from '@/lib/db/timelines';
import { slugify } from '@/lib/utils/slugify';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, visualization_type, is_public, is_collaborative } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug
    const slug = slugify(title);

    // Create timeline
    const timeline = await createTimeline({
      title,
      description,
      slug,
      creator_id: userId,
      visualization_type: visualization_type || 'horizontal',
      is_public: is_public !== false,
      is_collaborative: is_collaborative || false,
    });

    return NextResponse.json(timeline, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // List timelines (with pagination, filters, etc.)
  // Implementation here
}
```

### Get Timeline (`app/api/timelines/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTimelineById, updateTimeline, deleteTimeline } from '@/lib/db/timelines';
import { auth } from '@clerk/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeline = await getTimelineById(params.id);
    
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const timeline = await updateTimeline(params.id, userId, body);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error updating timeline:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteTimeline(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete timeline' },
      { status: 500 }
    );
  }
}
```

---

## Database Functions (`lib/db/timelines.ts`)

**Note:** See `RAILWAY_DEPLOYMENT.md` for PostgreSQL/Prisma implementation. Below is the interface pattern:

```typescript
// Using Prisma (recommended for Railway)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Or using raw PostgreSQL
import pool from './postgres';
import { Timeline, CreateTimelineInput } from '@/lib/types';

export async function createTimeline(input: CreateTimelineInput & { slug: string; creator_id: string }): Promise<Timeline> {
  const { data, error } = await supabase
    .from('timelines')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTimelineById(id: string): Promise<Timeline | null> {
  const { data, error } = await supabase
    .from('timelines')
    .select(`
      *,
      creator:users(*),
      events(*),
      categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

export async function getTimelineBySlug(slug: string): Promise<Timeline | null> {
  const { data, error } = await supabase
    .from('timelines')
    .select(`
      *,
      creator:users(*),
      events(*),
      categories(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updateTimeline(
  id: string,
  userId: string,
  updates: Partial<Timeline>
): Promise<Timeline> {
  // First check if user owns timeline
  const { data: timeline } = await supabase
    .from('timelines')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (!timeline || timeline.creator_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('timelines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTimeline(id: string, userId: string): Promise<void> {
  // Check ownership
  const { data: timeline } = await supabase
    .from('timelines')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (!timeline || timeline.creator_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('timelines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getFeaturedTimelines(limit: number = 10): Promise<Timeline[]> {
  const { data, error } = await supabase
    .from('timelines')
    .select(`
      *,
      creator:users(username, avatar_url)
    `)
    .eq('is_public', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

---

## Environment Variables (`.env.local`)

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production on Railway:
# NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

---

## Package Dependencies (`package.json`)

```json
{
  "name": "storywall",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@clerk/nextjs": "^4.29.0",
    "@prisma/client": "^5.0.0",
    "pg": "^8.11.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vis-timeline": "^7.7.3",
    "date-fns": "^3.0.0",
    "cloudinary": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/pg": "^8.10.0",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "prisma": "^5.0.0"
  }
}
```

---

## Implementation Steps

### Week 1: Core Infrastructure

**Day 1-2: Setup**
- Initialize Next.js project with TypeScript
- Set up Tailwind CSS
- Configure Clerk authentication
- Set up Supabase project and database

**Day 3-4: Database & Auth**
- Create database schema in Supabase
- Implement user authentication flow
- Create database query functions
- Set up API routes structure

**Day 5-7: Basic UI**
- Create layout components (Header, Footer)
- Build homepage
- Create timeline list/explore page
- Implement basic routing

### Week 2: Timeline Creation & Viewing

**Day 8-10: Timeline Creation**
- Build timeline creation form
- Implement event creation form
- Add category management
- Connect to API

**Day 11-14: Timeline Visualization**
- Implement horizontal timeline (vis-timeline)
- Build vertical timeline component
- Create card grid timeline
- Add view switcher

### Week 3: Polish & Deploy

**Day 15-17: Features**
- Add image upload
- Implement search/filtering
- Add edit/delete functionality
- Improve mobile responsiveness

**Day 18-20: Testing & Deploy**
- Bug fixes
- Performance optimization
- Deploy to Vercel
- Set up custom domain

---

## Key Features for MVP

✅ **Must Have:**
- User authentication (Clerk)
- Create timeline
- Add events to timeline
- View timeline (3 visualization types)
- Public/private timelines
- Basic search/browse

❌ **Not in MVP (Later):**
- Collaborative editing
- Comments
- Image uploads (use URLs for MVP)
- Map view
- Export functionality
- Analytics

---

## Success Metrics

**Week 1:** Infrastructure complete, auth working
**Week 2:** Can create and view timelines
**Week 3:** Deployed and usable

**Launch Goals:**
- 10 seed timelines created
- 100 users in first week
- 50 timelines created by users

---

## Next Steps After MVP

1. Add collaborative editing
2. Implement map timeline view
3. Add image upload functionality
4. Build premium features
5. Add export (PDF/image)
6. Implement search/discovery improvements
7. Add analytics dashboard

---

This specification is ready to be given to Cursor AI to build the MVP. All components, database schema, API routes, and implementation steps are clearly defined.
