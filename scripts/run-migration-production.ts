/**
 * Script to run the image_prompt migration on production database
 * 
 * Usage:
 * 1. Get your Railway DATABASE_URL from Railway Dashboard → PostgreSQL Service → Variables
 * 2. Set it as an environment variable:
 *    export DATABASE_URL="your_railway_database_url"
 * 3. Run: npx tsx scripts/run-migration-production.ts
 */

import { prisma } from '@/lib/db/prisma';

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add image_prompt column to events table...\n');
    
    // Check if column already exists
    const checkColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'image_prompt'
    `);

    if (checkColumn.length > 0) {
      console.log('✅ Column image_prompt already exists - no migration needed');
      return;
    }

    console.log('📝 Column does not exist, adding it now...');
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;
    `);

    console.log('✅ Successfully added image_prompt column to events table');
    console.log('\n🎉 Migration complete! The production site should now work correctly.');
  } catch (error: any) {
    console.error('❌ Error running migration:', error.message);
    console.error('\nMake sure:');
    console.error('1. DATABASE_URL environment variable is set to your Railway database');
    console.error('2. The database is accessible from your network');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

