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
      year,
      month,
      day,
      number,
      image_url,
      image_prompt,
      location_lat,
      location_lng,
      location_name,
      category,
      links,
    } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    
    // Handle date updates: either use date string directly, or construct from year/month/day
    if (date !== undefined) {
      updates.date = date;
    } else if (year !== undefined) {
      // Construct date from year/month/day
      const yearNum = parseInt(year);
      const monthNum = month ? parseInt(month) : 1;
      const dayNum = day ? parseInt(day) : 1;
      if (!isNaN(yearNum)) {
        // Handle BC dates (negative years)
        if (yearNum < 0) {
          // For BC dates, use ISO format string
          const monthStr = monthNum.toString().padStart(2, '0');
          const dayStr = dayNum.toString().padStart(2, '0');
          updates.date = `${yearNum}-${monthStr}-${dayStr}`;
        } else {
          // For AD dates, use Date object
          updates.date = new Date(yearNum, monthNum - 1, dayNum).toISOString().split('T')[0];
        }
      }
    }
    
    if (end_date !== undefined) updates.end_date = end_date;
    if (number !== undefined) updates.number = number;
    if (image_url !== undefined) updates.image_url = image_url;
    if (image_prompt !== undefined) updates.image_prompt = image_prompt;
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

