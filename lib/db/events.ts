import { prisma } from './prisma';
import { Event, CreateEventInput } from '@/lib/types';

export async function createEvent(input: CreateEventInput & { created_by?: string }): Promise<Event> {
  const event = await prisma.event.create({
    data: {
      timelineId: input.timeline_id,
      title: input.title,
      description: input.description,
      date: new Date(input.date),
      ...(input.end_date && { endDate: new Date(input.end_date) }),
      ...(input.number !== undefined && { number: input.number }),
      ...(input.number_label && { numberLabel: input.number_label }),
      imageUrl: input.image_url,
      locationLat: input.location_lat ? input.location_lat : undefined,
      locationLng: input.location_lng ? input.location_lng : undefined,
      locationName: input.location_name,
      category: input.category,
      links: input.links || [],
      createdBy: input.created_by,
    },
  });

  return transformEvent(event);
}

export async function getEventById(id: string): Promise<Event | null> {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) return null;
  return transformEvent(event);
}

export async function getEventsByTimelineId(timelineId: string): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: { timelineId },
    orderBy: { date: 'asc' },
  });

  return events.map(transformEvent);
}

export async function updateEvent(
  id: string,
  userId: string,
  updates: Partial<CreateEventInput>
): Promise<Event> {
  // Check if user created the event or owns the timeline
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      timeline: {
        select: { creatorId: true },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // User must be event creator or timeline owner
  if (event.createdBy !== userId && event.timeline.creatorId !== userId) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.date && { date: new Date(updates.date) }),
      ...(updates.end_date && { endDate: new Date(updates.end_date) }),
      ...(updates.image_url !== undefined && { imageUrl: updates.image_url }),
      ...(updates.location_lat !== undefined && { locationLat: updates.location_lat }),
      ...(updates.location_lng !== undefined && { locationLng: updates.location_lng }),
      ...(updates.location_name !== undefined && { locationName: updates.location_name }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.links !== undefined && { links: updates.links }),
    },
  });

  return transformEvent(updated);
}

export async function deleteEvent(id: string, userId: string): Promise<void> {
  // Check if user created the event or owns the timeline
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      timeline: {
        select: { creatorId: true },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // User must be event creator or timeline owner
  if (event.createdBy !== userId && event.timeline.creatorId !== userId) {
    throw new Error('Unauthorized');
  }

  // Delete image from Cloudinary if it exists
  if (event.imageUrl) {
    try {
      const { deleteImageFromCloudinary } = await import('@/lib/utils/imageCleanup');
      await deleteImageFromCloudinary(event.imageUrl);
      console.log(`[Delete Event] Deleted image from Cloudinary for event ${id}`);
    } catch (error: any) {
      // Log error but don't fail the deletion - we still want to delete the event
      console.error('[Delete Event] Error deleting image from Cloudinary:', error);
    }
  }

  await prisma.event.delete({
    where: { id },
  });
}

// Helper function to transform Prisma model to our TypeScript type
function transformEvent(event: any): Event {
  return {
    id: event.id,
    timeline_id: event.timelineId,
    title: event.title,
    description: event.description || undefined,
    date: event.date.toISOString().split('T')[0],
    end_date: event.endDate ? event.endDate.toISOString().split('T')[0] : undefined,
    number: event.number || undefined,
    number_label: event.numberLabel || undefined,
    image_url: event.imageUrl || undefined,
    location_lat: event.locationLat ? parseFloat(event.locationLat.toString()) : undefined,
    location_lng: event.locationLng ? parseFloat(event.locationLng.toString()) : undefined,
    location_name: event.locationName || undefined,
    category: event.category || undefined,
    links: event.links || [],
    created_by: event.createdBy || undefined,
    created_at: event.createdAt.toISOString(),
    updated_at: event.updatedAt.toISOString(),
  };
}

