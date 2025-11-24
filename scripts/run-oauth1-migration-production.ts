/**
 * Script to run the Twitter OAuth 1.0a migration on production database
 * 
 * Usage:
 * 1. Get your Railway DATABASE_URL from Railway Dashboard → PostgreSQL Service → Variables
 * 2. Set it as an environment variable:
 *    export DATABASE_URL="your_railway_database_url"
 * 3. Run: npx tsx scripts/run-oauth1-migration-production.ts
 * 
 * Or use Railway CLI:
 * railway run --service postgres npx tsx scripts/run-oauth1-migration-production.ts
 */

import { prisma } from '@/lib/db/prisma';

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add Twitter OAuth 1.0a columns to users table...\n');
    
    // Check if columns already exist
    const checkColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('twitter_oauth1_token', 'twitter_oauth1_token_secret')
    `);

    const existingColumns = checkColumns.map(c => c.column_name);
    
    if (existingColumns.includes('twitter_oauth1_token') && existingColumns.includes('twitter_oauth1_token_secret')) {
      console.log('✅ Columns twitter_oauth1_token and twitter_oauth1_token_secret already exist - no migration needed');
      return;
    }

    console.log('📝 Adding missing columns...');
    
    // Add the columns
    if (!existingColumns.includes('twitter_oauth1_token')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token" TEXT;
      `);
      console.log('✅ Added twitter_oauth1_token column');
    }
    
    if (!existingColumns.includes('twitter_oauth1_token_secret')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token_secret" TEXT;
      `);
      console.log('✅ Added twitter_oauth1_token_secret column');
    }

    console.log('\n🎉 Migration complete! Twitter OAuth 1.0a support is now enabled.');
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

