/**
 * Runs before `next start` when migrations can't apply (e.g. P3005 on existing DBs).
 * Adds columns the Prisma schema expects so queries don't fail with P2022.
 */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "share_count" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("[ensure-production-schema] timelines.share_count OK");
  } catch (e) {
    console.error("[ensure-production-schema]", e && e.message ? e.message : e);
    // Don't block boot; Prisma queries may still fail until DB is fixed manually
  } finally {
    await prisma.$disconnect();
  }
}

main();
