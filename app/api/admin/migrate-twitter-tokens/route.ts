import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/utils/admin';
import { getUserByClerkId } from '@/lib/db/users';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getUserByClerkId(userId);
    const userEmail = userProfile?.email || null;

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
    }

    console.log('Admin user attempting to add Twitter token columns...');

    // Check if columns exist first
    const checkColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('twitter_access_token', 'twitter_refresh_token')
    `);

    const existingColumns = checkColumns.map(c => c.column_name);
    const results: string[] = [];

    // Add twitter_access_token if it doesn't exist
    if (!existingColumns.includes('twitter_access_token')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN "twitter_access_token" TEXT;
      `);
      results.push('Added twitter_access_token column');
      console.log('Successfully added twitter_access_token column');
    } else {
      results.push('twitter_access_token column already exists');
    }

    // Add twitter_refresh_token if it doesn't exist
    if (!existingColumns.includes('twitter_refresh_token')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN "twitter_refresh_token" TEXT;
      `);
      results.push('Added twitter_refresh_token column');
      console.log('Successfully added twitter_refresh_token column');
    } else {
      results.push('twitter_refresh_token column already exists');
    }

    return NextResponse.json({ 
      message: 'Migration completed successfully',
      results 
    });
  } catch (error: any) {
    console.error('Error adding Twitter token columns:', error);
    return NextResponse.json(
      { error: 'Failed to add Twitter token columns', details: error.message },
      { status: 500 }
    );
  }
}

