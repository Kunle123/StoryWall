import { NextRequest, NextResponse } from 'next/server';
import { getTimelineById, getTimelineBySlug, updateTimeline, deleteTimeline } from '@/lib/db/timelines';
import { slugify } from '@/lib/utils/slugify';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';

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
    console.log('[API] Fetching timeline with id/slug:', id);
    console.log('[API] Is UUID:', isUUID(id));
    console.log('[API] Slug length:', id.length);
    
    // Try to find by ID or slug
    let timeline;
    try {
      if (isUUID(id)) {
        console.log('[API] Calling getTimelineById with id:', id);
        const startTime = Date.now();
        timeline = await getTimelineById(id);
        const duration = Date.now() - startTime;
        console.log(`[API] getTimelineById completed in ${duration}ms, result:`, timeline ? `FOUND - ${timeline.title}` : 'NOT FOUND');
        if (!timeline) {
          console.log('[API] getTimelineById returned null - checking database directly...');
          // Direct database check
          const { prisma } = await import('@/lib/db/prisma');
          const directCheck = await prisma.$queryRawUnsafe(`SELECT id, title FROM timelines WHERE id = '${id.replace(/'/g, "''")}' LIMIT 1`);
          console.log('[API] Direct database check result:', directCheck);
        }
      } else {
        console.log('[API] Calling getTimelineBySlug with slug:', id);
        const startTime = Date.now();
        timeline = await getTimelineBySlug(id);
        const duration = Date.now() - startTime;
        console.log(`[API] getTimelineBySlug completed in ${duration}ms, result:`, timeline ? `FOUND - ${timeline.title}` : 'NOT FOUND');
      }
    } catch (dbError: any) {
      console.error('[API] Database error:', dbError.message);
      console.error('[API] Database error stack:', dbError.stack?.substring(0, 500));
      throw dbError; // Re-throw to be caught by outer catch
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
    console.error('[API] Error fetching timeline:', error);
    console.error('[API] Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
      code: error.code,
    });
    // If it's a "not found" error, return 404, otherwise 500
    if (error.message?.includes('not found') || error.message?.includes('Not found')) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }
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
    
    // Get user's email for admin check
    const userProfile = await getUserByClerkId(userId);
    const userEmail = userProfile?.email || null;

    const body = await request.json();
    const { title, description, visualization_type, is_public, is_collaborative } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (visualization_type !== undefined) updates.visualization_type = visualization_type;
    if (is_public !== undefined) updates.is_public = is_public;
    if (is_collaborative !== undefined) updates.is_collaborative = is_collaborative;

    const timeline = await updateTimeline(id, user.id, updates, userEmail);

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
    
    // Get user's email for admin check
    const userProfile = await getUserByClerkId(userId);
    const userEmail = userProfile?.email || null;

    await deleteTimeline(id, user.id, userEmail);

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

