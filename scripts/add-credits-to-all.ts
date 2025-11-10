import { prisma } from '../lib/db/prisma';

async function addCreditsToAll() {
  const emails = [
    'ibidunkunle@gmail.com',
    'scametha@gmail.com',
    'kunle2000@gmail.com'
  ];
  const creditsToAdd = 2000;
  
  try {
    console.log(`Adding ${creditsToAdd} credits to ${emails.length} users...\n`);
    
    for (const email of emails) {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email },
          select: { id: true, email: true, username: true, credits: true }
        });
        
        if (!user) {
          console.log(`❌ User with email ${email} not found - skipping`);
          continue;
        }
        
        const oldCredits = user.credits;
        
        // Update credits
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { credits: user.credits + creditsToAdd },
          select: { email: true, username: true, credits: true }
        });
        
        console.log(`✅ ${updated.username || updated.email}`);
        console.log(`   ${oldCredits} → ${updated.credits} credits (+${creditsToAdd})\n`);
        
      } catch (error: any) {
        console.error(`❌ Error updating ${email}:`, error.message);
      }
    }
    
    console.log('✓ Completed!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToAll();

