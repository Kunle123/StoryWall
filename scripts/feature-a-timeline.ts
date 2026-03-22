import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

/**
 * Mark one (or more) public timeline(s) as featured for the home page.
 *
 * Usage:
 *   npx tsx scripts/feature-a-timeline.ts
 *     → Features the public timeline with the highest view_count.
 *
 *   npx tsx scripts/feature-a-timeline.ts <timeline-uuid>
 *     → Features that timeline (must exist and be public).
 *
 *   npx tsx scripts/feature-a-timeline.ts --solo
 *     → Clears featured on all timelines first, then features one (highest views).
 *
 * Railway (with DATABASE_URL in env):
 *   railway run npx tsx scripts/feature-a-timeline.ts --solo
 */

import { prisma } from '../lib/db/prisma';

async function main() {
  const args = process.argv.slice(2);
  const solo = args.includes('--solo');
  const idArg = args.find((a) => /^[0-9a-f-]{36}$/i.test(a));

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Load .env or run via Railway with DB attached.');
    process.exit(1);
  }

  if (solo) {
    const cleared = await prisma.timeline.updateMany({
      data: { isFeatured: false, featuredAt: null },
    });
    console.log(`Cleared featured flag on ${cleared.count} timeline(s).`);
  }

  const now = new Date();

  if (idArg) {
    const t = await prisma.timeline.findFirst({
      where: { id: idArg, isPublic: true },
    });
    if (!t) {
      console.error(`No public timeline found with id: ${idArg}`);
      process.exit(1);
    }
    await prisma.timeline.update({
      where: { id: idArg },
      data: { isFeatured: true, featuredAt: now },
    });
    console.log(`Featured: "${t.title}" (${t.id})`);
    return;
  }

  const pick = await prisma.timeline.findFirst({
    where: { isPublic: true },
    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
  });

  if (!pick) {
    console.error('No public timelines found.');
    process.exit(1);
  }

  await prisma.timeline.update({
    where: { id: pick.id },
    data: { isFeatured: true, featuredAt: now },
  });
  console.log(`Featured: "${pick.title}" (${pick.id}) — ${pick.viewCount} views`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
