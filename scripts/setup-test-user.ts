import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function setupTestUser() {
  try {
    console.log('🔧 Setting up test user...\n');

    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: 'test-user-clerk-id' },
    });

    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}\n`);
      console.log('💡 Use this user ID for testing: ' + existingUser.id);
      await prisma.$disconnect();
      return existingUser;
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        clerkId: 'test-user-clerk-id',
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
      },
    });

    console.log('✅ Test user created successfully:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}\n`);
    console.log('💡 Use this user ID for testing: ' + user.id);
    
    await prisma.$disconnect();
    return user;
  } catch (error: any) {
    console.error('❌ Error setting up test user:', error);
    if (error.code === 'P2002') {
      console.log('   User with this clerk_id or username already exists.');
    }
    process.exit(1);
  }
}

setupTestUser();

