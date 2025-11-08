import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to delete timelines by ID
 * POST /api/admin/timelines/delete
 * Body: { timelineIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timelineIds } = body;

    if (!timelineIds || !Array.isArray(timelineIds) || timelineIds.length === 0) {
      return NextResponse.json(
        { error: 'timelineIds array is required' },
        { status: 400 }
      );
    }

    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const timelineId of timelineIds) {
      try {
        // Fetch events with images before deletion
        const events = await prisma.event.findMany({
          where: { timelineId },
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
            await deleteImagesFromCloudinary(imageUrls);
          } catch (error: any) {
            console.error('[Delete Timeline] Error deleting images from Cloudinary:', error);
          }
        }
        
        // Delete the timeline (this will cascade delete events, comments, likes, etc.)
        await prisma.timeline.delete({
          where: { id: timelineId },
        });
        
        results.deleted++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to delete timeline ${timelineId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[Admin Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete timelines' },
      { status: 500 }
    );
  }
}

