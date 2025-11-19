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
    const { title, description, visualization_type, is_public, is_collaborative, is_numbered, number_label, start_date, end_date, hashtags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug by checking database and appending counter if needed
    // Titles can be duplicated, but slugs must be unique
    const { getTimelineBySlug } = await import('@/lib/db/timelines');
    while (true) {
      try {
        const existingTimeline = await getTimelineBySlug(slug);
        if (existingTimeline) {
          // Slug exists, try with counter
          slug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          // Slug is unique, break out of loop
          break;
        }
      } catch (error: any) {
        // If getTimelineBySlug throws (e.g., timeline not found), slug is available
        // Break out of loop to use this slug
        break;
      }
    }

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
      hashtags: hashtags || [],
    });

    return NextResponse.json(timeline, { status: 201 });
  } catch (error: any) {
    console.error('Error creating timeline:', error);
    
    // Handle unique constraint errors (shouldn't happen now with slug checking, but keep as fallback)
    if (error.code === 'P2002') {
      // This is a slug uniqueness error, not a title error
      // Try to generate a unique slug with timestamp
      try {
        const body = await request.json();
        const { slugify } = await import('@/lib/utils/slugify');
        const timestamp = Date.now();
        const uniqueSlug = `${slugify(body.title || 'timeline')}-${timestamp}`;
        
        const timeline = await createTimeline({
          title: body.title,
          description: body.description,
          slug: uniqueSlug,
          creator_id: user.id,
          visualization_type: body.visualization_type || 'horizontal',
          is_public: body.is_public !== false,
          is_collaborative: body.is_collaborative || false,
          is_numbered: body.is_numbered || false,
          number_label: body.number_label || null,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          hashtags: body.hashtags || [],
        });
        
        return NextResponse.json(timeline, { status: 201 });
      } catch (retryError: any) {
        return NextResponse.json(
          { error: 'Failed to create timeline. Please try again.' },
          { status: 500 }
        );
      }
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
    const hashtag = searchParams.get('hashtag');
    const searchQuery = searchParams.get('q') || searchParams.get('search');
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
      hashtag: hashtag || undefined,
      searchQuery: searchQuery || undefined,
    });

    // Return as array (client expects array directly, not wrapped in { data })
    return NextResponse.json(timelines || []);
  } catch (error: any) {
    console.error('Error fetching timelines:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([]);
  }
}

