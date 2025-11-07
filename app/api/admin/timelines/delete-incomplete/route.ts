import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to delete timelines with incomplete events
 * POST /api/admin/timelines/delete-incomplete
 * Body: { timelineIds?: string[] } - optional, if not provided, deletes all incomplete timelines
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // For now, allow deletions (should be restricted in production)
    
    const body = await request.json();
    const { timelineIds } = body;
    
    // Fetch all timelines or specific ones
    const timelines = await prisma.timeline.findMany({
      where: timelineIds ? { id: { in: timelineIds } } : { isPublic: true },
      include: {
        events: {
          select: {
            id: true,
            description: true,
            imageUrl: true,
          },
        },
      },
    });
    
    // Filter incomplete timelines
    const incompleteTimelines = timelines.filter(timeline => {
      if (!timeline.events || timeline.events.length === 0) {
        return true; // No events at all
      }
      
      // Check if events are missing descriptions or images
      const hasDescriptions = timeline.events.some(e => e.description);
      const hasImages = timeline.events.some(e => e.imageUrl);
      
      return !hasDescriptions || !hasImages;
    });
    
    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const timeline of incompleteTimelines) {
      try {
        // Fetch all events with images before deletion
        const events = await prisma.event.findMany({
          where: { timelineId: timeline.id },
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
            console.log(`[Delete Incomplete Timeline] Deleted ${deletedCount}/${imageUrls.length} images from Cloudinary for timeline ${timeline.id}`);
          } catch (error: any) {
            // Log error but don't fail the deletion
            console.error('[Delete Incomplete Timeline] Error deleting images from Cloudinary:', error);
          }
        }
        
        // Delete the timeline (this will cascade delete events, comments, likes, etc.)
        await prisma.timeline.delete({
          where: { id: timeline.id },
        });
        
        results.deleted++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to delete timeline "${timeline.title}" (${timeline.id}): ${error.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results: {
        ...results,
        totalChecked: timelines.length,
        incompleteFound: incompleteTimelines.length,
      },
    });
  } catch (error: any) {
    console.error('[Admin Delete Incomplete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete incomplete timelines' },
      { status: 500 }
    );
  }
}

