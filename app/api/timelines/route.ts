import { NextRequest, NextResponse } from 'next/server';
import { createTimeline, listTimelines } from '@/lib/db/timelines';
import { slugify } from '@/lib/utils/slugify';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user (auto-creates if doesn't exist)
    const user = await getOrCreateUser(userId);

    const body = await request.json();
    const { title, description, visualization_type, is_public, is_collaborative, is_numbered, number_label, start_date, end_date } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    // Note: In production, check against database
    // For now, we'll let Prisma handle uniqueness constraint

    // Create timeline
    const timeline = await createTimeline({
      title,
      description,
      slug,
      creator_id: user.id, // Use actual user ID from database
      visualization_type: visualization_type || 'horizontal',
      is_public: is_public !== false,
      is_collaborative: is_collaborative || false,
      is_numbered: is_numbered || false,
      number_label: number_label || null,
      start_date: start_date || null,
      end_date: end_date || null,
    });

    return NextResponse.json(timeline, { status: 201 });
  } catch (error: any) {
    console.error('Error creating timeline:', error);
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A timeline with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create timeline' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const isPublic = searchParams.get('is_public');
    const creatorId = searchParams.get('creator_id');
    const mine = searchParams.get('mine') === 'true'; // Special parameter to get current user's timelines

    let finalCreatorId = creatorId;

    // If "mine=true", get current user's database ID and filter by it
    if (mine) {
      try {
        const { userId } = await auth();
        if (userId) {
          const user = await getOrCreateUser(userId);
          finalCreatorId = user.id;
        } else {
          // Not authenticated, return empty array
          return NextResponse.json([]);
        }
      } catch (authError) {
        // Auth error, return empty array
        return NextResponse.json([]);
      }
    }

    const timelines = await listTimelines({
      limit,
      offset,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      creatorId: finalCreatorId || undefined,
    });

    // Return as array (client expects array directly, not wrapped in { data })
    return NextResponse.json(timelines || []);
  } catch (error: any) {
    console.error('Error fetching timelines:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([]);
  }
}

