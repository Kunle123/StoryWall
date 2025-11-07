import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventsByTimelineId } from '@/lib/db/events';
import { getTimelineById } from '@/lib/db/timelines';

// Note: Auth is currently disabled. Uncomment when Clerk is configured.
// import { auth } from '@clerk/nextjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Verify timeline exists
    const timeline = await getTimelineById(params.id);
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // TODO: Check if user has permission to add events (owner or collaborator)
    // For now, allow anyone to add events

    const body = await request.json();
    const {
      title,
      description,
      date,
      end_date,
      number,
      number_label,
      image_url,
      location_lat,
      location_lng,
      location_name,
      category,
      links,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      timeline_id: params.id,
      title,
      description,
      date,
      end_date,
      number,
      number_label,
      image_url,
      location_lat,
      location_lng,
      location_name,
      category,
      links: links || [],
      created_by: undefined, // Replace with userId when auth is enabled
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify timeline exists
    const timeline = await getTimelineById(params.id);
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    const events = await getEventsByTimelineId(params.id);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

