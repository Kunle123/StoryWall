import { prisma } from './prisma';
import { Timeline, CreateTimelineInput } from '@/lib/types';
import { isAdminEmail } from '@/lib/utils/admin';

export async function createTimeline(
  input: CreateTimelineInput & { slug: string; creator_id: string }
): Promise<Timeline> {
  // Try normal Prisma create first
  try {
    const timelineData: any = {
      title: input.title,
      description: input.description,
      slug: input.slug,
      creatorId: input.creator_id,
      visualizationType: input.visualization_type || 'horizontal',
      isPublic: input.is_public !== false,
      isCollaborative: input.is_collaborative || false,
    };
    
    // Only include isNumbered and numberLabel if explicitly provided
    if (input.is_numbered !== undefined) {
      timelineData.isNumbered = input.is_numbered;
    }
    
    if (input.number_label !== undefined) {
      timelineData.numberLabel = input.number_label;
    }
    
    // Include hashtags if provided
    if (input.hashtags !== undefined) {
      timelineData.hashtags = input.hashtags;
    }
    
    const timeline = await prisma.timeline.create({
      data: timelineData,
      include: {
        creator: true,
        events: true,
        categories: true,
      },
    });

    return transformTimeline(timeline);
  } catch (error: any) {
    // If error is about missing is_numbered column, use raw SQL as fallback
    if (error.message?.includes('is_numbered') || error.message?.includes('isNumbered')) {
      console.warn('[createTimeline] Falling back to raw SQL due to missing is_numbered column');
      
      const isNumbered = input.is_numbered !== undefined ? input.is_numbered : false;
      const numberLabel = input.number_label || 'Day';
      
      const timelineId = crypto.randomUUID();
      const now = new Date();
      
      // Use raw SQL to insert timeline (without is_numbered and number_label since they don't exist)
      await prisma.$executeRawUnsafe(`
        INSERT INTO timelines (
          id, title, description, slug, creator_id, 
          visualization_type, is_public, is_collaborative, 
          view_count, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `,
        timelineId,
        input.title,
        input.description || null,
        input.slug,
        input.creator_id,
        input.visualization_type || 'horizontal',
        input.is_public !== false,
        input.is_collaborative || false,
        0,
        now,
        now
      );
      
      // Fetch the created timeline using raw SQL to avoid is_numbered column issue
      const timelineRows = await prisma.$queryRawUnsafe<Array<{
        id: string;
        title: string;
        description: string | null;
        slug: string;
        creator_id: string;
        visualization_type: string;
        is_public: boolean;
        is_collaborative: boolean;
        view_count: number;
        created_at: Date;
        updated_at: Date;
      }>>(`
        SELECT id, title, description, slug, creator_id, 
               visualization_type, is_public, is_collaborative, 
               view_count, created_at, updated_at
        FROM timelines
        WHERE id = $1
      `, timelineId);
      
      if (!timelineRows || timelineRows.length === 0) {
        throw new Error('Failed to create timeline via raw SQL');
      }
      
      const timelineRow = timelineRows[0];
      
      // Fetch relations separately using raw SQL to avoid missing column issues
      const creator = await prisma.user.findUnique({ where: { id: timelineRow.creator_id } });
      
      // Use raw SQL for events to avoid number column issue
      // Sort by date - BC dates stored as negative years will sort correctly
      const eventRows = await prisma.$queryRawUnsafe<Array<any>>(`
        SELECT id, timeline_id, title, description, date, end_date, 
               image_url, location_lat, location_lng, location_name, 
               category, links, created_by, created_at, updated_at
        FROM events
        WHERE timeline_id = $1
        ORDER BY date ASC
      `, timelineRow.id);
      
      const events = eventRows.map((row: any) => ({
        id: row.id,
        timelineId: row.timeline_id,
        title: row.title,
        description: row.description,
        date: row.date,
        endDate: row.end_date,
        number: null, // Column doesn't exist
        numberLabel: null, // Column doesn't exist
        imageUrl: row.image_url,
        locationLat: row.location_lat,
        locationLng: row.location_lng,
        locationName: row.location_name,
        category: row.category,
        links: row.links || [],
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      
      const categories = await prisma.category.findMany({ where: { timelineId: timelineRow.id } });
      
      // Construct timeline object matching Prisma's format
      const timeline = {
        id: timelineRow.id,
        title: timelineRow.title,
        description: timelineRow.description,
        slug: timelineRow.slug,
        creatorId: timelineRow.creator_id,
        visualizationType: timelineRow.visualization_type,
        isPublic: timelineRow.is_public,
        isCollaborative: timelineRow.is_collaborative,
        isNumbered: false, // Default since column doesn't exist
        numberLabel: 'Day', // Default since column doesn't exist
        viewCount: timelineRow.view_count,
        createdAt: timelineRow.created_at,
        updatedAt: timelineRow.updated_at,
        creator: creator ? {
          id: creator.id,
          clerkId: creator.clerkId,
          username: creator.username,
          email: creator.email,
          avatarUrl: creator.avatarUrl,
          credits: creator.credits,
          createdAt: creator.createdAt,
          updatedAt: creator.updatedAt,
        } : null,
        events: events,
        categories: categories,
      };
      
      return transformTimeline(timeline as any);
    }
    
    throw error;
  }
}

export async function getTimelineById(id: string): Promise<Timeline | null> {
  // Use raw SQL as primary method to avoid is_numbered column issues
  try {
    console.log('[getTimelineById] Using raw SQL for id:', id);
    
    // Ensure connection is active
    try {
      await prisma.$connect();
    } catch (connectError) {
      // Connection might already be active, ignore
      console.log('[getTimelineById] Connection check:', connectError instanceof Error ? connectError.message : 'already connected');
    }
    
    // Use raw SQL to fetch timeline (without is_numbered and number_label since they don't exist)
    // First try Prisma findUnique (simpler and more reliable)
    try {
      const timeline = await prisma.timeline.findUnique({
        where: { id },
        include: {
          creator: true,
          events: {
            orderBy: { date: 'asc' },
          },
          categories: true,
        },
      });
      
      if (timeline) {
        console.log('[getTimelineById] Found via Prisma findUnique');
        return transformTimeline(timeline as any);
      }
    } catch (prismaError: any) {
      console.log('[getTimelineById] Prisma findUnique failed, falling back to raw SQL:', prismaError.message);
    }
    
    // Fallback to raw SQL if Prisma fails
    const query = `SELECT id, title, description, slug, creator_id, 
               visualization_type, is_public, is_collaborative, 
               view_count, created_at, updated_at
        FROM timelines
        WHERE id = '${id.replace(/'/g, "''")}'`;
    const timelineRows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      creator_id: string;
      visualization_type: string;
      is_public: boolean;
      is_collaborative: boolean;
      view_count: number;
      created_at: Date;
      updated_at: Date;
    }>>(query);
    
    console.log('[getTimelineById] Raw SQL found', timelineRows.length, 'rows');
    if (timelineRows.length === 0) return null;
    
    const timelineRow = timelineRows[0];
    
    // Fetch relations separately using raw SQL to avoid missing column issues
    const creator = await prisma.user.findUnique({ where: { id: timelineRow.creator_id } });
    
    // Use raw SQL for events to avoid number column issue
    const eventsQuery = `SELECT id, timeline_id, title, description, date, end_date, 
               image_url, location_lat, location_lng, location_name, 
               category, links, created_by, created_at, updated_at
        FROM events
        WHERE timeline_id = '${timelineRow.id.replace(/'/g, "''")}'
        ORDER BY date ASC`;
    const eventRows = await prisma.$queryRawUnsafe<Array<any>>(eventsQuery);
    
    const events = eventRows.map((row: any) => ({
      id: row.id,
      timelineId: row.timeline_id,
      title: row.title,
      description: row.description,
      date: row.date,
      endDate: row.end_date,
      number: null, // Column doesn't exist
      numberLabel: null, // Column doesn't exist
      imageUrl: row.image_url,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      locationName: row.location_name,
      category: row.category,
      links: row.links || [],
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    const categories = await prisma.category.findMany({ where: { timelineId: timelineRow.id } });
    
    // Construct timeline object matching Prisma's format
    const timeline = {
      id: timelineRow.id,
      title: timelineRow.title,
      description: timelineRow.description,
      slug: timelineRow.slug,
      creatorId: timelineRow.creator_id,
      visualizationType: timelineRow.visualization_type,
      isPublic: timelineRow.is_public,
      isCollaborative: timelineRow.is_collaborative,
      isNumbered: false, // Default since column doesn't exist
      numberLabel: 'Day', // Default since column doesn't exist
      viewCount: timelineRow.view_count,
      createdAt: timelineRow.created_at,
      updatedAt: timelineRow.updated_at,
      creator: creator ? {
        id: creator.id,
        clerkId: creator.clerkId,
        username: creator.username,
        email: creator.email,
        avatarUrl: creator.avatarUrl,
        credits: creator.credits,
        createdAt: creator.createdAt,
        updatedAt: creator.updatedAt,
      } : null,
      events: events,
      categories: categories,
    };
    
    try {
      return transformTimeline(timeline as any);
    } catch (transformError: any) {
      console.error('[getTimelineById] Error in transformTimeline:', transformError.message);
      console.error('[getTimelineById] Transform error stack:', transformError.stack?.substring(0, 500));
      throw transformError;
    }
  } catch (error: any) {
    console.error('[getTimelineById] Error in raw SQL fallback:', error.message);
    console.error('[getTimelineById] Error stack:', error.stack?.substring(0, 500));
    // Fallback to Prisma if raw SQL fails
    try {
      console.log('[getTimelineById] Falling back to Prisma findUnique...');
      const timeline = await prisma.timeline.findUnique({
        where: { id },
        include: {
          creator: true,
          events: {
            orderBy: { date: 'asc' },
          },
          categories: true,
        },
      });

      if (!timeline) return null;
      return transformTimeline(timeline);
    } catch (prismaError: any) {
      console.error('[getTimelineById] Prisma fallback also failed:', prismaError.message);
      // If error is about missing is_numbered column, that's expected - we already tried raw SQL
      if (prismaError.message?.includes('is_numbered') || prismaError.message?.includes('isNumbered')) {
        console.error('[getTimelineById] Both raw SQL and Prisma failed - database schema issue');
        return null;
      }
      console.warn('[getTimelineById] Falling back to raw SQL due to missing is_numbered column');
      
      // Use raw SQL to fetch timeline (without is_numbered and number_label since they don't exist)
      const query = `SELECT id, title, description, slug, creator_id, 
               visualization_type, is_public, is_collaborative, 
               view_count, created_at, updated_at
        FROM timelines
        WHERE id = '${id.replace(/'/g, "''")}'`;
      console.log('[getTimelineById] Raw SQL query:', query.substring(0, 100));
      const timelineRows = await prisma.$queryRawUnsafe<Array<{
        id: string;
        title: string;
        description: string | null;
        slug: string;
        creator_id: string;
        visualization_type: string;
        is_public: boolean;
        is_collaborative: boolean;
        view_count: number;
        created_at: Date;
        updated_at: Date;
      }>>(query);
      
      console.log('[getTimelineById] Raw SQL found', timelineRows.length, 'rows');
      if (timelineRows.length === 0) return null;
      
      const timelineRow = timelineRows[0];
      
      // Fetch relations separately using raw SQL to avoid missing column issues
      const creator = await prisma.user.findUnique({ where: { id: timelineRow.creator_id } });
      
      // Use raw SQL for events to avoid number column issue
      // Sort by date - BC dates stored as negative years will sort correctly
      const eventsQuery = `SELECT id, timeline_id, title, description, date, end_date, 
               image_url, location_lat, location_lng, location_name, 
               category, links, created_by, created_at, updated_at
        FROM events
        WHERE timeline_id = '${timelineRow.id.replace(/'/g, "''")}'
        ORDER BY date ASC`;
      const eventRows = await prisma.$queryRawUnsafe<Array<any>>(eventsQuery);
      
      const events = eventRows.map((row: any) => ({
        id: row.id,
        timelineId: row.timeline_id,
        title: row.title,
        description: row.description,
        date: row.date,
        endDate: row.end_date,
        number: null, // Column doesn't exist
        numberLabel: null, // Column doesn't exist
        imageUrl: row.image_url,
        locationLat: row.location_lat,
        locationLng: row.location_lng,
        locationName: row.location_name,
        category: row.category,
        links: row.links || [],
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      
      const categories = await prisma.category.findMany({ where: { timelineId: timelineRow.id } });
      
      // Construct timeline object matching Prisma's format
      const timeline = {
        id: timelineRow.id,
        title: timelineRow.title,
        description: timelineRow.description,
        slug: timelineRow.slug,
        creatorId: timelineRow.creator_id,
        visualizationType: timelineRow.visualization_type,
        isPublic: timelineRow.is_public,
        isCollaborative: timelineRow.is_collaborative,
        isNumbered: false, // Default since column doesn't exist
        numberLabel: 'Day', // Default since column doesn't exist
        viewCount: timelineRow.view_count,
        createdAt: timelineRow.created_at,
        updatedAt: timelineRow.updated_at,
        creator: creator ? {
          id: creator.id,
          clerkId: creator.clerkId,
          username: creator.username,
          email: creator.email,
          avatarUrl: creator.avatarUrl,
          credits: creator.credits,
          createdAt: creator.createdAt,
          updatedAt: creator.updatedAt,
        } : null,
        events: events,
        categories: categories,
      };
      
      return transformTimeline(timeline as any);
    }
    
    throw error;
  }
}

export async function getTimelineBySlug(slug: string): Promise<Timeline | null> {
  // Use raw SQL as primary method to avoid is_numbered column issues (same as getTimelineById)
  try {
    console.log('[getTimelineBySlug] Using raw SQL for slug:', slug);
    
    // Use raw SQL to fetch timeline by slug
    const query = `SELECT id, title, description, slug, creator_id, 
             visualization_type, is_public, is_collaborative, 
             view_count, created_at, updated_at
      FROM timelines
      WHERE slug = '${slug.replace(/'/g, "''")}'`;
    const timelineRows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      creator_id: string;
      visualization_type: string;
      is_public: boolean;
      is_collaborative: boolean;
      view_count: number;
      created_at: Date;
      updated_at: Date;
    }>>(query);
    
    console.log('[getTimelineBySlug] Raw SQL found', timelineRows.length, 'rows');
    if (timelineRows.length === 0) return null;
    
    const timelineRow = timelineRows[0];
    const creator = await prisma.user.findUnique({ where: { id: timelineRow.creator_id } });
    
    // Sort by date - BC dates stored as negative years will sort correctly
    const eventsQuery = `SELECT id, timeline_id, title, description, date, end_date, 
             image_url, location_lat, location_lng, location_name, 
             category, links, created_by, created_at, updated_at
      FROM events
      WHERE timeline_id = '${timelineRow.id.replace(/'/g, "''")}'
      ORDER BY date ASC`;
    const eventRows = await prisma.$queryRawUnsafe<Array<any>>(eventsQuery);
    
    const events = eventRows.map((row: any) => ({
      id: row.id,
      timelineId: row.timeline_id,
      title: row.title,
      description: row.description,
      date: row.date,
      endDate: row.end_date,
      number: null,
      numberLabel: null,
      imageUrl: row.image_url,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      locationName: row.location_name,
      category: row.category,
      links: row.links || [],
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    const categories = await prisma.category.findMany({ where: { timelineId: timelineRow.id } });
    
    const timeline = {
      id: timelineRow.id,
      title: timelineRow.title,
      description: timelineRow.description,
      slug: timelineRow.slug,
      creatorId: timelineRow.creator_id,
      visualizationType: timelineRow.visualization_type,
      isPublic: timelineRow.is_public,
      isCollaborative: timelineRow.is_collaborative,
      isNumbered: false,
      numberLabel: 'Day',
      viewCount: timelineRow.view_count,
      createdAt: timelineRow.created_at,
      updatedAt: timelineRow.updated_at,
      creator: creator ? {
        id: creator.id,
        clerkId: creator.clerkId,
        username: creator.username,
        email: creator.email,
        avatarUrl: creator.avatarUrl,
        credits: creator.credits,
        createdAt: creator.createdAt,
        updatedAt: creator.updatedAt,
      } : null,
      events: events,
      categories: categories,
    };
    
    try {
      return transformTimeline(timeline as any);
    } catch (transformError: any) {
      console.error('[getTimelineBySlug] Error in transformTimeline:', transformError.message);
      console.error('[getTimelineBySlug] Transform error stack:', transformError.stack?.substring(0, 500));
      throw transformError;
    }
  } catch (error: any) {
    console.error('[getTimelineBySlug] Error in raw SQL:', error.message);
    console.error('[getTimelineBySlug] Error stack:', error.stack?.substring(0, 500));
    // Fallback to Prisma if raw SQL fails
    try {
      console.log('[getTimelineBySlug] Falling back to Prisma findUnique...');
      const timeline = await prisma.timeline.findUnique({
        where: { slug },
        include: {
          creator: true,
          events: {
            orderBy: { date: 'asc' },
          },
          categories: true,
        },
      });

      if (!timeline) return null;
      return transformTimeline(timeline);
    } catch (prismaError: any) {
      console.error('[getTimelineBySlug] Prisma fallback also failed:', prismaError.message);
      return null;
    }
  }
}

export async function updateTimeline(
  id: string,
  userId: string,
  updates: Partial<CreateTimelineInput>,
  userEmail?: string | null
): Promise<Timeline> {
  // First check if user owns timeline or is an admin
  const timeline = await prisma.timeline.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!timeline) {
    throw new Error('Timeline not found');
  }

  // Allow if user owns timeline OR is an admin
  const isOwner = timeline.creatorId === userId;
  const isAdmin = userEmail ? isAdminEmail(userEmail) : false;

  if (!isOwner && !isAdmin) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.timeline.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.visualization_type && { visualizationType: updates.visualization_type }),
      ...(updates.is_public !== undefined && { isPublic: updates.is_public }),
      ...(updates.is_collaborative !== undefined && { isCollaborative: updates.is_collaborative }),
    },
    include: {
      creator: true,
      events: true,
      categories: true,
    },
  });

  return transformTimeline(updated);
}

export async function deleteTimeline(
  id: string,
  userId: string,
  userEmail?: string | null
): Promise<void> {
  // Check ownership or admin status
  const timeline = await prisma.timeline.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!timeline) {
    throw new Error('Timeline not found');
  }

  // Allow if user owns timeline OR is an admin
  const isOwner = timeline.creatorId === userId;
  const isAdmin = userEmail ? isAdminEmail(userEmail) : false;

  if (!isOwner && !isAdmin) {
    throw new Error('Unauthorized');
  }

  // Fetch all events with images before deletion
  const events = await prisma.event.findMany({
    where: { timelineId: id },
    select: { imageUrl: true },
  });

  // Extract image URLs
  const imageUrls = events
    .map(event => event.imageUrl)
    .filter((url): url is string => url !== null && url !== undefined);

  // Delete images from Cloudinary if any exist
  if (imageUrls.length > 0) {
    try {
      const { deleteImagesFromCloudinary } = await import('@/lib/utils/imageCleanup');
      const deletedCount = await deleteImagesFromCloudinary(imageUrls);
      console.log(`[Delete Timeline] Deleted ${deletedCount}/${imageUrls.length} images from Cloudinary`);
    } catch (error: any) {
      // Log error but don't fail the deletion - we still want to delete the timeline
      console.error('[Delete Timeline] Error deleting images from Cloudinary:', error);
    }
  }

  // Delete the timeline (this will cascade delete events, comments, likes, etc.)
  await prisma.timeline.delete({
    where: { id },
  });
}

export async function getFeaturedTimelines(limit: number = 10): Promise<Timeline[]> {
  const timelines = await prisma.timeline.findMany({
    where: { isPublic: true },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      events: {
        take: 1, // Just to indicate there are events
      },
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
  });

  return timelines.map(transformTimeline);
}

export async function listTimelines(options: {
  limit?: number;
  offset?: number;
  isPublic?: boolean;
  creatorId?: string;
  hashtag?: string;
  searchQuery?: string;
}): Promise<Timeline[]> {
  try {
    const where: any = {
      ...(options.isPublic !== undefined && { isPublic: options.isPublic }),
      ...(options.creatorId && { creatorId: options.creatorId }),
    };

    // Filter by hashtag if provided
    if (options.hashtag) {
      where.hashtags = {
        has: options.hashtag.toLowerCase(),
      };
    }

    // Search in title, description, or hashtags
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { hashtags: { hasSome: [query] } },
      ];
    }

    // Try to query with events, but if it fails due to missing columns, query without events
    let timelines;
    try {
      timelines = await prisma.timeline.findMany({
        where,
        include: {
          creator: true,
          events: {
            take: 1,
            select: {
              id: true,
              timelineId: true,
              title: true,
              description: true,
              date: true,
              endDate: true,
              imageUrl: true,
              // Don't select image_prompt - it may not exist in production DB
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        skip: options.offset || 0,
      });
    } catch (prismaError: any) {
      // If Prisma fails (e.g., missing image_prompt column), query without events
      console.error('[listTimelines] Prisma query with events failed, querying without events:', prismaError.message);
      timelines = await prisma.timeline.findMany({
        where,
        include: {
          creator: true,
          // Don't include events if there's a schema mismatch
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        skip: options.offset || 0,
      });
    }

    return timelines.map(transformTimeline);
  } catch (error: any) {
    // If Prisma fails (e.g., schema mismatch), fall back to raw SQL
    console.error('[listTimelines] Prisma query failed, using raw SQL fallback:', error.message);
    
    // Build WHERE clause for raw SQL (with proper escaping)
    const conditions: string[] = [];
    
    if (options.isPublic !== undefined) {
      conditions.push(`is_public = ${options.isPublic}`);
    }

    if (options.creatorId) {
      // Escape single quotes in creatorId
      const escapedCreatorId = options.creatorId.replace(/'/g, "''");
      conditions.push(`creator_id = '${escapedCreatorId}'`);
    }

    // Note: hashtag and searchQuery filtering would need more complex SQL
    // For now, just get the basic filtered results

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const query = `
      SELECT id, title, description, slug, creator_id, 
             visualization_type, is_public, is_collaborative, 
             view_count, created_at, updated_at
      FROM timelines
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const timelineRows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      creator_id: string;
      visualization_type: string;
      is_public: boolean;
      is_collaborative: boolean;
      view_count: number;
      created_at: Date;
      updated_at: Date;
    }>>(query);

    // Fetch creators and events for each timeline
    const timelines = await Promise.all(
      timelineRows.map(async (row) => {
        const creator = await prisma.user.findUnique({ where: { id: row.creator_id } });
        const events = await prisma.event.findMany({
          where: { timelineId: row.id },
          take: 1,
        });

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          slug: row.slug,
          creatorId: row.creator_id,
          visualizationType: row.visualization_type,
          isPublic: row.is_public,
          isCollaborative: row.is_collaborative,
          viewCount: row.view_count,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          creator: creator ? {
            id: creator.id,
            username: creator.username,
            email: creator.email,
            avatarUrl: creator.avatarUrl,
          } : null,
          events: events,
        };
      })
    );

    return timelines.map(transformTimeline);
  }
}

// Helper function to transform Prisma models to our TypeScript types
function transformTimeline(timeline: any): Timeline {
  return {
    id: timeline.id,
    title: timeline.title,
    description: timeline.description || undefined,
    slug: timeline.slug,
    creator_id: timeline.creatorId,
    creator: timeline.creator
      ? {
          id: timeline.creator.id,
          clerk_id: timeline.creator.clerkId,
          username: timeline.creator.username,
          email: timeline.creator.email,
          avatar_url: timeline.creator.avatarUrl || undefined,
          created_at: timeline.creator.createdAt instanceof Date ? timeline.creator.createdAt.toISOString() : new Date(timeline.creator.createdAt).toISOString(),
          updated_at: timeline.creator.updatedAt instanceof Date ? timeline.creator.updatedAt.toISOString() : new Date(timeline.creator.updatedAt).toISOString(),
        }
      : undefined,
    visualization_type: timeline.visualizationType as 'horizontal' | 'vertical' | 'grid',
    is_public: timeline.isPublic,
    is_collaborative: timeline.isCollaborative,
    is_numbered: timeline.isNumbered !== undefined ? timeline.isNumbered : undefined,
    number_label: timeline.numberLabel || undefined,
    hashtags: timeline.hashtags || [],
    view_count: timeline.viewCount,
    created_at: timeline.createdAt instanceof Date ? timeline.createdAt.toISOString() : new Date(timeline.createdAt).toISOString(),
    updated_at: timeline.updatedAt instanceof Date ? timeline.updatedAt.toISOString() : new Date(timeline.updatedAt).toISOString(),
    events: timeline.events
      ? timeline.events.map((e: any) => ({
          id: e.id,
          timeline_id: e.timelineId,
          title: e.title,
          description: e.description || undefined,
          date: e.date instanceof Date ? e.date.toISOString().split('T')[0] : new Date(e.date).toISOString().split('T')[0],
          end_date: e.endDate ? (e.endDate instanceof Date ? e.endDate.toISOString().split('T')[0] : new Date(e.endDate).toISOString().split('T')[0]) : undefined,
          image_url: e.imageUrl || undefined,
          location_lat: e.locationLat ? parseFloat(e.locationLat.toString()) : undefined,
          location_lng: e.locationLng ? parseFloat(e.locationLng.toString()) : undefined,
          location_name: e.locationName || undefined,
          category: e.category || undefined,
          links: e.links || [],
          created_by: e.createdBy || undefined,
          created_at: e.createdAt instanceof Date ? e.createdAt.toISOString() : new Date(e.createdAt).toISOString(),
          updated_at: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : new Date(e.updatedAt).toISOString(),
        }))
      : undefined,
    categories: timeline.categories
      ? timeline.categories.map((c: any) => ({
          id: c.id,
          timeline_id: c.timelineId,
          name: c.name,
          color: c.color,
          created_at: c.createdAt.toISOString(),
        }))
      : undefined,
  };
}

