import { prisma } from '@/lib/db/prisma';

async function migrateTwitterTokens() {
  try {
    console.log('🔧 Starting Twitter token columns migration...\n');

    // Check if columns exist first
    const checkColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('twitter_access_token', 'twitter_refresh_token')
    `);

    const existingColumns = checkColumns.map(c => c.column_name);
    console.log('Existing columns:', existingColumns);

    // Add twitter_access_token if it doesn't exist
    if (!existingColumns.includes('twitter_access_token')) {
      console.log('Adding twitter_access_token column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN "twitter_access_token" TEXT;
      `);
      console.log('✅ Successfully added twitter_access_token column');
    } else {
      console.log('✅ twitter_access_token column already exists');
    }

    // Add twitter_refresh_token if it doesn't exist
    if (!existingColumns.includes('twitter_refresh_token')) {
      console.log('Adding twitter_refresh_token column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN "twitter_refresh_token" TEXT;
      `);
      console.log('✅ Successfully added twitter_refresh_token column');
    } else {
      console.log('✅ twitter_refresh_token column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Error running migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateTwitterTokens();

