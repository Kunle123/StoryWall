/**
 * Script to fix credit balances after duplicate webhook issue
 * 
 * Usage:
 *   tsx scripts/fix-credits-balance.ts [clerkUserId] [expectedCredits]
 * 
 * Example:
 *   tsx scripts/fix-credits-balance.ts user_abc123 2000
 */

import { prisma } from '../lib/db/prisma';
import { getOrCreateUser } from '../lib/db/users';

async function fixCreditsBalance(clerkUserId: string, expectedCredits: number) {
  try {
    console.log(`\n🔧 Fixing credits balance for user: ${clerkUserId}`);
    console.log(`Expected credits: ${expectedCredits}\n`);

    // Get user
    const user = await getOrCreateUser(clerkUserId);
    
    // Get current credits
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true, email: true, username: true },
    });

    if (!currentUser) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`Current balance: ${currentUser.credits} credits`);
    console.log(`Expected balance: ${expectedCredits} credits`);

    if (currentUser.credits === expectedCredits) {
      console.log('✅ Credits already correct!');
      return;
    }

    const difference = expectedCredits - currentUser.credits;
    
    if (difference > 0) {
      console.log(`\n➕ Adding ${difference} credits...`);
    } else {
      console.log(`\n➖ Removing ${Math.abs(difference)} credits...`);
    }

    // Update credits
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: expectedCredits,
      },
      select: { credits: true },
    });

    console.log(`\n✅ Credits updated!`);
    console.log(`New balance: ${updated.credits} credits`);
    console.log(`\nUser: ${currentUser.username} (${currentUser.email})`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const clerkUserId = process.argv[2];
const expectedCredits = parseInt(process.argv[3] || '0', 10);

if (!clerkUserId || !expectedCredits) {
  console.error('Usage: tsx scripts/fix-credits-balance.ts [clerkUserId] [expectedCredits]');
  console.error('Example: tsx scripts/fix-credits-balance.ts user_abc123 2000');
  process.exit(1);
}

fixCreditsBalance(clerkUserId, expectedCredits)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

