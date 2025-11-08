import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function addCredits() {
  try {
    const email = 'bidunkunle@gmail.com';
    const creditsToAdd = 2000;
    
    console.log(`🔧 Adding ${creditsToAdd} credits to: ${email}\n`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Update credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        credits: creditsToAdd // Set to 2000 (not add to existing)
      },
    });

    console.log('✅ Credits updated successfully:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Previous Credits: ${user.credits}`);
    console.log(`   New Credits: ${updatedUser.credits}`);
    console.log(`   User ID: ${updatedUser.id}\n`);
    
    await prisma.$disconnect();
    return updatedUser;
  } catch (error: any) {
    console.error('❌ Error updating credits:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addCredits();

