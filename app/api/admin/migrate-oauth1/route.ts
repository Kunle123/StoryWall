import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Temporary API endpoint to run Twitter OAuth 1.0a migration
 * This should be deleted after the migration is complete
 * 
 * Usage: POST /api/admin/migrate-oauth1
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow authenticated users (you can restrict this further if needed)
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running migration: Add Twitter OAuth 1.0a columns to users table...');
    
    // Check if columns already exist
    const checkColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('twitter_oauth1_token', 'twitter_oauth1_token_secret')
    `);

    const existingColumns = checkColumns.map(c => c.column_name);
    
    if (existingColumns.includes('twitter_oauth1_token') && existingColumns.includes('twitter_oauth1_token_secret')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Columns already exist - no migration needed',
        existingColumns 
      });
    }

    console.log('📝 Adding missing columns...');
    
    // Add the columns
    const results: string[] = [];
    
    if (!existingColumns.includes('twitter_oauth1_token')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token" TEXT;
      `);
      results.push('twitter_oauth1_token');
      console.log('✅ Added twitter_oauth1_token column');
    }
    
    if (!existingColumns.includes('twitter_oauth1_token_secret')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token_secret" TEXT;
      `);
      results.push('twitter_oauth1_token_secret');
      console.log('✅ Added twitter_oauth1_token_secret column');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete! Twitter OAuth 1.0a support is now enabled.',
      addedColumns: results
    });
  } catch (error: any) {
    console.error('❌ Error running migration:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to run migration',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

