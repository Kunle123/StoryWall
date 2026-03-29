import { prisma } from "@/lib/db/prisma";

/** Bonus credits for 1st / 2nd / 3rd public story (see GitHub #4). */
const TIER_GRANTS = [30, 20, 10] as const;

/**
 * Call when a timeline becomes **public** (create as public, or private → public).
 * Increments `publishedStoryCount`, sets `firstStoryPublishedAt` on first public story,
 * and adds tiered credits (30 / 20 / 10 for publishes 1–3).
 */
export async function applyPublicPublishRewards(creatorUserId: string): Promise<{
  creditsAdded: number;
  publishIndex: number;
}> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: creatorUserId },
      select: {
        publishedStoryCount: true,
        firstStoryPublishedAt: true,
        credits: true,
      },
    });

    if (!user) {
      throw new Error("User not found for publish rewards");
    }

    const publishIndex = user.publishedStoryCount + 1;
    const tierIndex = publishIndex - 1;
    const creditsAdded =
      tierIndex >= 0 && tierIndex < TIER_GRANTS.length ? TIER_GRANTS[tierIndex] : 0;

    await tx.user.update({
      where: { id: creatorUserId },
      data: {
        publishedStoryCount: publishIndex,
        ...(user.firstStoryPublishedAt == null &&
          publishIndex === 1 && {
            firstStoryPublishedAt: new Date(),
          }),
        ...(creditsAdded > 0 && {
          credits: { increment: creditsAdded },
        }),
      },
    });

    if (creditsAdded > 0) {
      console.log(
        `[publishRewards] User ${creatorUserId} public publish #${publishIndex}: +${creditsAdded} credits`
      );
    }

    return { creditsAdded, publishIndex };
  });
}
