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
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] GET /api/timelines/[id] - Route handler called');
  try {
    const { id } = await params;
    console.log('[API] Fetching timeline with id:', id);
    console.log('[API] Is UUID:', isUUID(id));
    
    // Try to find by ID or slug
    let timeline;
    if (isUUID(id)) {
      console.log('[API] Calling getTimelineById...');
      timeline = await getTimelineById(id);
      console.log('[API] getTimelineById result:', timeline ? 'FOUND' : 'NOT FOUND');
    } else {
      console.log('[API] Calling getTimelineBySlug...');
      timeline = await getTimelineBySlug(id);
      console.log('[API] getTimelineBySlug result:', timeline ? 'FOUND' : 'NOT FOUND');
    }
    
    if (!timeline) {
      console.log('[API] Timeline not found, returning 404');
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }
    
    console.log('[API] Timeline found, returning:', timeline.title);
    console.log('[API] Timeline has', timeline.events?.length || 0, 'events');

    // Increment view count (could be moved to a separate endpoint for better performance)
    // For now, we'll update it on view
    // TODO: Implement view count increment asynchronously

    try {
      const response = NextResponse.json(timeline);
      console.log('[API] Successfully created JSON response');
      return response;
    } catch (jsonError: any) {
      console.error('[API] Error serializing timeline to JSON:', jsonError.message);
      throw jsonError;
    }
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
    });
    return NextResponse.json(
      { error: 'Failed to fetch timeline', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const timeline = await updateTimeline(id, user.id, updates);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    await deleteTimeline(id, user.id);

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

