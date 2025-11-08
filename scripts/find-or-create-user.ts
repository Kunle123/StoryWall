import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function findOrCreateUser() {
  try {
    const email = 'ibidunkunle@gmail.com';
    const creditsToAdd = 2000;
    
    console.log(`🔧 Finding or creating user: ${email}\n`);

    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('⚠️  User not found. Creating new user...\n');
      
      // Generate a placeholder Clerk ID
      const placeholderClerkId = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract username from email
      const username = email.split('@')[0];
      
      // Create user
      user = await prisma.user.create({
        data: {
          clerkId: placeholderClerkId,
          username,
          email,
          credits: creditsToAdd,
        },
      });
      
      console.log('✅ User created with credits:');
    } else {
      console.log('✅ User found. Updating credits...\n');
      
      // Update credits
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          credits: creditsToAdd
        },
      });
      
      console.log('✅ Credits updated:');
    }

    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Credits: ${user.credits}`);
    console.log(`   User ID: ${user.id}\n`);
    
    await prisma.$disconnect();
    return user;
  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.code === 'P2002') {
      console.log('   User with this email or username already exists.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

findOrCreateUser();

