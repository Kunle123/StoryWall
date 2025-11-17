import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/db/users';
import { isAdminEmail } from '@/lib/utils/admin';

/**
 * One-time migration endpoint to add image_prompt column
 * Only accessible by admin users
 * 
 * Call: POST /api/admin/migrate-image-prompt
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await getUserByClerkId(userId);
    const userEmail = userProfile?.email || null;
    const isAdmin = userEmail ? isAdminEmail(userEmail) : false;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('[Migration] Starting image_prompt column migration...');

    // Check if column already exists
    const checkColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'image_prompt'
    `);

    if (checkColumn.length > 0) {
      console.log('[Migration] Column already exists');
      return NextResponse.json({ 
        success: true, 
        message: 'Column image_prompt already exists - no migration needed' 
      });
    }

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;
    `);

    console.log('[Migration] Successfully added image_prompt column');

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added image_prompt column to events table' 
    });
  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run migration' },
      { status: 500 }
    );
  }
}

