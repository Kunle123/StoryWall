import { NextRequest, NextResponse } from 'next/server';
import { createTimeline, listTimelines } from '@/lib/db/timelines';
import { slugify } from '@/lib/utils/slugify';

// Note: Auth is currently disabled. Uncomment when Clerk is configured.
// import { auth } from '@clerk/nextjs';

export async function POST(request: NextRequest) {
  try {
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For now, use the test user ID until auth is set up
    // TODO: Replace with actual userId from Clerk auth
    const placeholderUserId = process.env.TEST_USER_ID || '4b499a69-c3f1-48ee-a938-305cce4c19e8';

    const body = await request.json();
    const { title, description, visualization_type, is_public, is_collaborative } = body;

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
      creator_id: placeholderUserId, // Replace with userId when auth is enabled
      visualization_type: visualization_type || 'horizontal',
      is_public: is_public !== false,
      is_collaborative: is_collaborative || false,
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

    const timelines = await listTimelines({
      limit,
      offset,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      creatorId: creatorId || undefined,
    });

    return NextResponse.json(timelines);
  } catch (error) {
    console.error('Error fetching timelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timelines' },
      { status: 500 }
    );
  }
}

