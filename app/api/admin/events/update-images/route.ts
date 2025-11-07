import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to update event images in batch
 * POST /api/admin/events/update-images
 * Body: { updates: [{ eventId: string, imageUrl: string }] }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // For now, allow updates (should be restricted in production)
    
    const body = await request.json();
    const { updates } = body;
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }
    
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const update of updates) {
      try {
        if (!update.eventId || !update.imageUrl) {
          results.failed++;
          results.errors.push(`Missing eventId or imageUrl for update`);
          continue;
        }
        
        await prisma.event.update({
          where: { id: update.eventId },
          data: { imageUrl: update.imageUrl },
        });
        
        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to update event ${update.eventId}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[Admin Update Images] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update images' },
      { status: 500 }
    );
  }
}

