import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function createUser() {
  try {
    const username = 'Manus123';
    const email = 'manus123@storywall.com'; // You can change this email
    
    console.log(`🔧 Creating user: ${username}\n`);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      console.log('⚠️  User already exists:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Clerk ID: ${existingUser.clerkId || 'None'}\n`);
      await prisma.$disconnect();
      return existingUser;
    }

    // Generate a placeholder Clerk ID (user will need to sign up through Clerk)
    const placeholderClerkId = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        clerkId: placeholderClerkId,
        username,
        email,
        credits: 1000, // Starting credits
      },
    });

    console.log('✅ User created successfully:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Credits: ${user.credits}\n`);
    console.log('⚠️  IMPORTANT: This user needs to sign up through Clerk to authenticate.');
    console.log('   The password "Accountgenerator123!" should be used when signing up through Clerk.');
    console.log('   Use the email above to sign up.\n');
    
    await prisma.$disconnect();
    return user;
  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    if (error.code === 'P2002') {
      console.log('   User with this username or email already exists.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

createUser();

