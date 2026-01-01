import { prisma } from '@/lib/db/prisma';

/**
 * One-off helper to add missing columns safely in production:
 * - users.bio (TEXT, nullable)
 * - timelines.is_featured (BOOLEAN NOT NULL DEFAULT false)
 *
 * Run with production DATABASE_URL, e.g.:
 *   DATABASE_URL="postgres://..." npx tsx scripts/add-missing-columns-production.ts
 */
async function run() {
  try {
    console.log('🔄 Checking/adding missing columns (bio, is_featured)...');

    const results = await prisma.$transaction(async (tx) => {
      const actions: string[] = [];

      // Add users.bio if missing
      const bioCols = await tx.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'bio'
      `);
      if (bioCols.length === 0) {
        await tx.$executeRawUnsafe(`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
        `);
        actions.push('Added users.bio');
      }

      // Add timelines.is_featured if missing
      const featuredCols = await tx.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'timelines'
          AND column_name = 'is_featured'
      `);
      if (featuredCols.length === 0) {
        await tx.$executeRawUnsafe(`
          ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
        `);
        actions.push('Added timelines.is_featured (default false)');
      }

      return actions;
    });

    if (results.length === 0) {
      console.log('✅ No changes needed (columns already exist).');
    } else {
      console.log(`✅ Completed: ${results.join(', ')}`);
    }

    console.log('🎉 Migration helper finished.');
  } catch (error: any) {
    console.error('❌ Error adding missing columns:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

run();

