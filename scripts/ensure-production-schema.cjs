/**
 * Runs before `next start` when migrations can't apply (e.g. P3005 on existing DBs).
 * Adds columns the Prisma schema expects so queries don't fail with P2022.
 */
const { PrismaClient } = require("@prisma/client");

/** Idempotent ALTERs for production DBs that lag behind prisma/schema.prisma */
const STATEMENTS = [
  // timelines
  `ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "share_count" INTEGER NOT NULL DEFAULT 0`,
  // users — OAuth / TikTok (see prisma User model)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_oauth1_token_secret" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tiktok_access_token" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tiktok_refresh_token" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tiktok_open_id" TEXT`,
];

async function main() {
  const prisma = new PrismaClient();
  try {
    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log(
      "[ensure-production-schema] OK:",
      STATEMENTS.length,
      "statements (timelines.share_count, users OAuth/TikTok columns)"
    );
  } catch (e) {
    console.error("[ensure-production-schema]", e && e.message ? e.message : e);
    // Don't block boot; Prisma queries may still fail until DB is fixed manually
  } finally {
    await prisma.$disconnect();
  }
}

main();
