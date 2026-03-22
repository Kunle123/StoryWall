import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

/**
 * Mark one public timeline as featured for the home page.
 *
 * Usage:
 *   npx tsx scripts/feature-a-timeline.ts
 *   npx tsx scripts/feature-a-timeline.ts <timeline-uuid>
 *   npx tsx scripts/feature-a-timeline.ts --solo
 *
 * **Local machine vs Railway DB:** The app’s DATABASE_URL uses `postgres.railway.internal`,
 * which only works *inside* Railway. From your laptop you must use the **public** Postgres URL.
 *
 * Add to `.env.local` (from Railway → Postgres → *Connect* / *Variables* → public URL):
 *   DATABASE_PUBLIC_URL="postgresql://..."
 *
 * Then:
 *   npx tsx scripts/feature-a-timeline.ts --solo
 *
 * (Do not rely on `railway run` alone unless DATABASE_PUBLIC_URL is also set for the script.)
 */

// Prefer public URL so Prisma can reach Postgres from your Mac
if (process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
}

function ensureDatabaseUrlIsReachableLocally(): void {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    console.error(`
No DATABASE_URL (or DATABASE_PUBLIC_URL).

From your laptop, add to .env.local:
  DATABASE_PUBLIC_URL="<copy from Railway → Postgres service → Connect tab (public URL)>"

Then run:
  npx tsx scripts/feature-a-timeline.ts --solo
`);
    process.exit(1);
  }
  if (url.includes('railway.internal')) {
    console.error(`
DATABASE_URL uses postgres.railway.internal — that hostname only works inside Railway’s network,
not from your computer.

Fix:
  1. Railway dashboard → open your **Postgres** service (not the app)
  2. **Connect** or **Variables** → copy the URL that uses a public host (often *.proxy.rlwy.net)
  3. In StoryWall/.env.local add:
       DATABASE_PUBLIC_URL="postgresql://..."

  4. Run again:
       npx tsx scripts/feature-a-timeline.ts --solo

Optional: add DATABASE_PUBLIC_URL to your **StoryWall** service variables in Railway (reference
the Postgres plugin variable) if you want scripts to work with \`railway run\`.
`);
    process.exit(1);
  }
}

ensureDatabaseUrlIsReachableLocally();

async function main() {
  const { prisma } = await import('../lib/db/prisma');
  const args = process.argv.slice(2);
  const solo = args.includes('--solo');
  const idArg = args.find((a) => /^[0-9a-f-]{36}$/i.test(a));

  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
