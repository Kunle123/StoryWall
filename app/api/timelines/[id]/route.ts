import { NextRequest, NextResponse } from 'next/server';
import { getTimelineById, getTimelineBySlug, updateTimeline, deleteTimeline } from '@/lib/db/timelines';
import { slugify } from '@/lib/utils/slugify';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';

// Helper to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by ID or slug
    let timeline;
    if (isUUID(params.id)) {
      timeline = await getTimelineById(params.id);
    } else {
      timeline = await getTimelineBySlug(params.id);
    }
    
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // Increment view count (could be moved to a separate endpoint for better performance)
    // For now, we'll update it on view
    // TODO: Implement view count increment asynchronously

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    const body = await request.json();
    const { title, description, visualization_type, is_public, is_collaborative } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (visualization_type !== undefined) updates.visualization_type = visualization_type;
    if (is_public !== undefined) updates.is_public = is_public;
    if (is_collaborative !== undefined) updates.is_collaborative = is_collaborative;

    const timeline = await updateTimeline(params.id, user.id, updates);

    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error('Error updating timeline:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    await deleteTimeline(params.id, user.id);

    return NextResponse.json({ message: 'Timeline deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting timeline:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete timeline' },
      { status: 500 }
    );
  }
}

