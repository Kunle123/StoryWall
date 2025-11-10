import { prisma } from '../lib/db/prisma';

async function addCredits() {
  const email = 'storywall_editor@gmail.com';
  const creditsToAdd = 2000;
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, username: true, credits: true }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found in database`);
      console.log(`Please check the email address or create the account first.`);
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${user.username || user.email}`);
    console.log(`  Current credits: ${user.credits}`);
    console.log(`  Adding: ${creditsToAdd} credits`);
    
    // Update credits
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits + creditsToAdd },
      select: { email: true, username: true, credits: true }
    });
    
    console.log(`\n✅ Successfully added ${creditsToAdd} credits`);
    console.log(`  New total: ${updated.credits} credits`);
    console.log(`  User: ${updated.username || updated.email}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();
