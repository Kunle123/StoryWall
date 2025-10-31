import { NextRequest, NextResponse } from 'next/server';
import { getEventById, updateEvent, deleteEvent } from '@/lib/db/events';

// Note: Auth is currently disabled. Uncomment when Clerk is configured.
// import { auth } from '@clerk/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getEventById(params.id);
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For now, use the test user ID until auth is set up
    const placeholderUserId = process.env.TEST_USER_ID || '4b499a69-c3f1-48ee-a938-305cce4c19e8';

    const body = await request.json();
    const {
      title,
      description,
      date,
      end_date,
      image_url,
      location_lat,
      location_lng,
      location_name,
      category,
      links,
    } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (image_url !== undefined) updates.image_url = image_url;
    if (location_lat !== undefined) updates.location_lat = location_lat;
    if (location_lng !== undefined) updates.location_lng = location_lng;
    if (location_name !== undefined) updates.location_name = location_name;
    if (category !== undefined) updates.category = category;
    if (links !== undefined) updates.links = links;

    const event = await updateEvent(params.id, placeholderUserId, updates);

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Error updating event:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (error.message === 'Event not found' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For now, use the test user ID until auth is set up
    const placeholderUserId = process.env.TEST_USER_ID || '4b499a69-c3f1-48ee-a938-305cce4c19e8';

    await deleteEvent(params.id, placeholderUserId);

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (error.message === 'Event not found' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

