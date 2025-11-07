import { prisma } from './prisma';
import { Timeline, CreateTimelineInput } from '@/lib/types';

export async function createTimeline(
  input: CreateTimelineInput & { slug: string; creator_id: string }
): Promise<Timeline> {
  const timelineData: any = {
    title: input.title,
    description: input.description,
    slug: input.slug,
    creatorId: input.creator_id,
    visualizationType: input.visualization_type || 'horizontal',
    isPublic: input.is_public !== false,
    isCollaborative: input.is_collaborative || false,
  };
  
  // Only include isNumbered and numberLabel if they're provided (for backward compatibility)
  if (input.is_numbered !== undefined) {
    timelineData.isNumbered = input.is_numbered;
  }
  if (input.number_label !== undefined) {
    timelineData.numberLabel = input.number_label;
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
}

export async function getTimelineById(id: string): Promise<Timeline | null> {
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
}

export async function getTimelineBySlug(slug: string): Promise<Timeline | null> {
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
}

export async function updateTimeline(
  id: string,
  userId: string,
  updates: Partial<CreateTimelineInput>
): Promise<Timeline> {
  // First check if user owns timeline
  const timeline = await prisma.timeline.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!timeline || timeline.creatorId !== userId) {
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

export async function deleteTimeline(id: string, userId: string): Promise<void> {
  // Check ownership
  const timeline = await prisma.timeline.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!timeline || timeline.creatorId !== userId) {
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
}): Promise<Timeline[]> {
  const timelines = await prisma.timeline.findMany({
    where: {
      ...(options.isPublic !== undefined && { isPublic: options.isPublic }),
      ...(options.creatorId && { creatorId: options.creatorId }),
    },
    include: {
      creator: true,
      events: {
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 20,
    skip: options.offset || 0,
  });

  return timelines.map(transformTimeline);
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
          created_at: timeline.creator.createdAt.toISOString(),
          updated_at: timeline.creator.updatedAt.toISOString(),
        }
      : undefined,
    visualization_type: timeline.visualizationType as 'horizontal' | 'vertical' | 'grid',
    is_public: timeline.isPublic,
    is_collaborative: timeline.isCollaborative,
    view_count: timeline.viewCount,
    created_at: timeline.createdAt.toISOString(),
    updated_at: timeline.updatedAt.toISOString(),
    events: timeline.events
      ? timeline.events.map((e: any) => ({
          id: e.id,
          timeline_id: e.timelineId,
          title: e.title,
          description: e.description || undefined,
          date: e.date.toISOString().split('T')[0],
          end_date: e.endDate ? e.endDate.toISOString().split('T')[0] : undefined,
          image_url: e.imageUrl || undefined,
          location_lat: e.locationLat ? parseFloat(e.locationLat.toString()) : undefined,
          location_lng: e.locationLng ? parseFloat(e.locationLng.toString()) : undefined,
          location_name: e.locationName || undefined,
          category: e.category || undefined,
          links: e.links || [],
          created_by: e.createdBy || undefined,
          created_at: e.createdAt.toISOString(),
          updated_at: e.updatedAt.toISOString(),
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

