import { prisma } from './prisma';
import { Event, CreateEventInput } from '@/lib/types';

/**
 * Check if a date string represents a BC date (starts with '-')
 */
function isBCDate(dateStr: string): boolean {
  return dateStr.startsWith('-');
}

/**
 * Convert a date string to a format that PostgreSQL can handle
 * For BC dates, we need to use raw SQL with the date string directly
 * For AD dates, we can use JavaScript Date objects
 */
function parseDateForDB(dateStr: string): Date | string {
  // If it's a BC date (starts with '-'), return the string as-is for raw SQL
  // PostgreSQL can handle BC dates in ISO format directly
  if (isBCDate(dateStr)) {
    return dateStr;
  }
  // For AD dates, use JavaScript Date object
  return new Date(dateStr);
}

export async function createEvent(input: CreateEventInput & { created_by?: string }): Promise<Event> {
  // Check if we need to use raw SQL (BC dates or missing number column)
  const needsRawSQL = isBCDate(input.date) || (input.end_date && isBCDate(input.end_date));
  
  if (needsRawSQL) {
    // Use raw SQL for BC dates to avoid JavaScript Date constructor issues
    console.log('[createEvent] Using raw SQL for BC date:', input.date);
    
    const eventId = crypto.randomUUID();
    const now = new Date();
    
    const linksArray = input.links && input.links.length > 0 ? input.links : [];
    
    // For BC dates, pass the date string directly to PostgreSQL
    // PostgreSQL's DATE type can handle BC dates in ISO format (e.g., '-3000-01-01')
    await prisma.$executeRawUnsafe(`
      INSERT INTO events (
        id, timeline_id, title, description, date, end_date,
        image_url, location_lat, location_lng, location_name,
        category, links, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10, $11, $12::text[], $13, $14, $15
      )
    `,
      eventId,
      input.timeline_id,
      input.title,
      input.description || null,
      input.date, // Pass BC date string directly
      input.end_date || null, // Pass BC date string directly if present
      input.image_url || null,
      input.location_lat || null,
      input.location_lng || null,
      input.location_name || null,
      input.category || null,
      linksArray,
      input.created_by || null,
      now,
      now
    );
    
    // Fetch the created event
    const eventRows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      timeline_id: string;
      title: string;
      description: string | null;
      date: Date;
      end_date: Date | null;
      image_url: string | null;
      location_lat: number | null;
      location_lng: number | null;
      location_name: string | null;
      category: string | null;
      links: string[];
      created_by: string | null;
      created_at: Date;
      updated_at: Date;
    }>>(`
      SELECT id, timeline_id, title, description, date, end_date,
             image_url, location_lat, location_lng, location_name,
             category, links, created_by, created_at, updated_at
      FROM events WHERE id = $1
    `, eventId);
    
    if (!eventRows || eventRows.length === 0) {
      throw new Error('Failed to create event via raw SQL');
    }
    
    const eventRow = eventRows[0];
    const transformedEvent = {
      id: eventRow.id,
      timelineId: eventRow.timeline_id,
      title: eventRow.title,
      description: eventRow.description,
      date: eventRow.date,
      endDate: eventRow.end_date,
      imageUrl: eventRow.image_url,
      locationLat: eventRow.location_lat,
      locationLng: eventRow.location_lng,
      locationName: eventRow.location_name,
      category: eventRow.category,
      links: eventRow.links || [],
      createdBy: eventRow.created_by,
      createdAt: eventRow.created_at,
      updatedAt: eventRow.updated_at,
    };
    
    return transformEvent(transformedEvent);
  }
  
  try {
    const event = await prisma.event.create({
      data: {
        timelineId: input.timeline_id,
        title: input.title,
        description: input.description,
        date: new Date(input.date),
        ...(input.end_date && { endDate: new Date(input.end_date) }),
        // Don't include number/numberLabel if columns don't exist
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
  } catch (error: any) {
    // If error is about missing number column, use raw SQL as fallback
    if (error.message?.includes('number') || error.code === 'P2022') {
      console.warn('[createEvent] Falling back to raw SQL due to missing number column');
      
      const eventId = crypto.randomUUID();
      const now = new Date();
      
      const linksArray = input.links && input.links.length > 0 ? input.links : [];
      await prisma.$executeRawUnsafe(`
        INSERT INTO events (
          id, timeline_id, title, description, date, end_date,
          image_url, location_lat, location_lng, location_name,
          category, links, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10, $11, $12::text[], $13, $14, $15
        )
      `,
        eventId,
        input.timeline_id,
        input.title,
        input.description || null,
        input.date, // Pass date string directly
        input.end_date || null,
        input.image_url || null,
        input.location_lat || null,
        input.location_lng || null,
        input.location_name || null,
        input.category || null,
        linksArray,
        input.created_by || null,
        now,
        now
      );
      
      // Fetch the created event with proper column names
      const eventRows = await prisma.$queryRawUnsafe<Array<{
        id: string;
        timeline_id: string;
        title: string;
        description: string | null;
        date: Date;
        end_date: Date | null;
        image_url: string | null;
        location_lat: number | null;
        location_lng: number | null;
        location_name: string | null;
        category: string | null;
        links: string[];
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
      }>>(`
        SELECT id, timeline_id, title, description, date, end_date,
               image_url, location_lat, location_lng, location_name,
               category, links, created_by, created_at, updated_at
        FROM events WHERE id = $1
      `, eventId);
      
      if (!eventRows || eventRows.length === 0) {
        throw new Error('Failed to create event via raw SQL');
      }
      
      const eventRow = eventRows[0];
      // Transform to match Prisma format
      const transformedEvent = {
        id: eventRow.id,
        timelineId: eventRow.timeline_id,
        title: eventRow.title,
        description: eventRow.description,
        date: eventRow.date,
        endDate: eventRow.end_date,
        imageUrl: eventRow.image_url,
        locationLat: eventRow.location_lat,
        locationLng: eventRow.location_lng,
        locationName: eventRow.location_name,
        category: eventRow.category,
        links: eventRow.links || [],
        createdBy: eventRow.created_by,
        createdAt: eventRow.created_at,
        updatedAt: eventRow.updated_at,
      };
      
      return transformEvent(transformedEvent);
    }
    
    throw error;
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) return null;
    return transformEvent(event);
  } catch (error: any) {
    // If error is about missing number column, use raw SQL as fallback
    if (error.message?.includes('number') || error.code === 'P2022') {
      console.warn('[getEventById] Falling back to raw SQL due to missing number column');
      
      const eventRows = await prisma.$queryRawUnsafe<Array<{
        id: string;
        timeline_id: string;
        title: string;
        description: string | null;
        date: Date;
        end_date: Date | null;
        image_url: string | null;
        location_lat: number | null;
        location_lng: number | null;
        location_name: string | null;
        category: string | null;
        links: string[];
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
      }>>(`
        SELECT id, timeline_id, title, description, date, end_date,
               image_url, location_lat, location_lng, location_name,
               category, links, created_by, created_at, updated_at
        FROM events WHERE id = $1
      `, id);
      
      if (!eventRows || eventRows.length === 0) return null;
      
      const eventRow = eventRows[0];
      // Transform to match Prisma format
      const transformedEvent = {
        id: eventRow.id,
        timelineId: eventRow.timeline_id,
        title: eventRow.title,
        description: eventRow.description,
        date: eventRow.date,
        endDate: eventRow.end_date,
        imageUrl: eventRow.image_url,
        locationLat: eventRow.location_lat,
        locationLng: eventRow.location_lng,
        locationName: eventRow.location_name,
        category: eventRow.category,
        links: eventRow.links || [],
        createdBy: eventRow.created_by,
        createdAt: eventRow.created_at,
        updatedAt: eventRow.updated_at,
      };
      
      return transformEvent(transformedEvent);
    }
    
    throw error;
  }
}

export async function getEventsByTimelineId(timelineId: string): Promise<Event[]> {
  // Sort by date - BC dates stored as negative years will sort correctly
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

  // Handle date updates - check if it's a BC date string
  let dateValue: Date | string | undefined;
  if (updates.date) {
    if (typeof updates.date === 'string' && updates.date.startsWith('-')) {
      // BC date - will need raw SQL
      dateValue = updates.date;
    } else {
      dateValue = new Date(updates.date);
    }
  }

  // Check if we need raw SQL for BC dates
  const needsRawSQL = typeof dateValue === 'string' && dateValue.startsWith('-');

  if (needsRawSQL) {
    // Use raw SQL for BC dates
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.title) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(updates.title);
      paramIndex++;
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(updates.description);
      paramIndex++;
    }
    if (dateValue) {
      updateFields.push(`date = $${paramIndex}::date`);
      updateValues.push(dateValue);
      paramIndex++;
    }
    if (updates.number !== undefined) {
      updateFields.push(`number = $${paramIndex}`);
      updateValues.push(updates.number);
      paramIndex++;
    }
    if (updates.image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex}`);
      updateValues.push(updates.image_url);
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    await prisma.$executeRawUnsafe(
      `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      ...updateValues
    );

    // Fetch updated event
    const updatedRows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      timeline_id: string;
      title: string;
      description: string | null;
      date: Date;
      end_date: Date | null;
      number: number | null;
      number_label: string | null;
      image_url: string | null;
      location_lat: number | null;
      location_lng: number | null;
      location_name: string | null;
      category: string | null;
      links: string[];
      created_by: string | null;
      created_at: Date;
      updated_at: Date;
    }>>(
      `SELECT id, timeline_id, title, description, date, end_date, number, number_label,
              image_url, location_lat, location_lng, location_name,
              category, links, created_by, created_at, updated_at
       FROM events WHERE id = $1`,
      id
    );

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Event not found');
    }

    return transformEvent(updatedRows[0] as any);
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(dateValue && typeof dateValue !== 'string' && { date: dateValue }),
      ...(updates.end_date && { endDate: new Date(updates.end_date) }),
      ...(updates.number !== undefined && { number: updates.number }),
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

