import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Admin email check
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = [
    'kunle2000@gmail.com',
    // Add other admin emails here
  ];
  return adminEmails.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError: any) {
      console.warn('[Admin Run Migration] Clerk auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication error. Please ensure you are signed in.' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from Clerk
    let clerkUser;
    try {
      const { currentUser } = await import('@clerk/nextjs/server');
      clerkUser = await currentUser();
    } catch (error: any) {
      console.error('[Admin Run Migration] Error getting current user:', error);
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }

    if (!clerkUser || !isAdminEmail(clerkUser.emailAddresses[0]?.emailAddress)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get migration name from body
    const body = await request.json();
    const migrationName = body.migration || 'bio_and_terms';

    console.log(`[Admin Run Migration] Running migration: ${migrationName}`);

    const results: string[] = [];
    const errors: string[] = [];

    // Run migrations based on name
    if (migrationName === 'bio_and_terms' || migrationName === 'all') {
      // Add bio column
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
        `);
        results.push('✅ Added bio column to users table');
      } catch (error: any) {
        errors.push(`❌ Failed to add bio column: ${error.message}`);
      }

      // Add terms_accepted_at column
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP(3);
        `);
        results.push('✅ Added terms_accepted_at column to users table');
      } catch (error: any) {
        errors.push(`❌ Failed to add terms_accepted_at column: ${error.message}`);
      }
    }

    // Timelines: add is_featured
    if (migrationName === 'timelines' || migrationName === 'all' || migrationName === 'is_featured') {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
        `);
        results.push('✅ Added is_featured column to timelines table');
      } catch (error: any) {
        errors.push(`❌ Failed to add is_featured column: ${error.message}`);
      }
    }

    if (migrationName === 'bio' || migrationName === 'all') {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
        `);
        results.push('✅ Added bio column to users table');
      } catch (error: any) {
        errors.push(`❌ Failed to add bio column: ${error.message}`);
      }
    }

    if (migrationName === 'terms' || migrationName === 'all') {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP(3);
        `);
        results.push('✅ Added terms_accepted_at column to users table');
      } catch (error: any) {
        errors.push(`❌ Failed to add terms_accepted_at column: ${error.message}`);
      }
    }

    // Verify columns exist
    const verifyResults: any = {};
    try {
      const userColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('bio', 'terms_accepted_at')
        ORDER BY column_name;
      `);
      
      verifyResults.bio = userColumns.some(c => c.column_name === 'bio');
      verifyResults.terms_accepted_at = userColumns.some(c => c.column_name === 'terms_accepted_at');

      const timelineColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'timelines'
        AND column_name IN ('is_featured')
        ORDER BY column_name;
      `);
      verifyResults.is_featured = timelineColumns.some(c => c.column_name === 'is_featured');
    } catch (error: any) {
      errors.push(`❌ Failed to verify columns: ${error.message}`);
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      verification: verifyResults,
      message: errors.length === 0 
        ? 'Migration completed successfully' 
        : 'Migration completed with some errors',
    });
  } catch (error: any) {
    console.error('[Admin Run Migration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run migration' },
      { status: 500 }
    );
  }
}

