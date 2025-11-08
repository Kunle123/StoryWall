import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function updateUserEmail() {
  try {
    const username = 'Manus123';
    // TODO: Replace with the actual email address you want to use
    const newEmail = 'fojon53329@limtu.com';
    
    console.log(`🔧 Updating email for user: ${username}\n`);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.error(`❌ User "${username}" not found.`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Check if new email is already taken
    const emailTaken = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (emailTaken && emailTaken.id !== user.id) {
      console.error(`❌ Email "${newEmail}" is already taken by another user.`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    console.log('✅ Email updated successfully:');
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Old Email: ${user.email}`);
    console.log(`   New Email: ${updatedUser.email}`);
    console.log(`   User ID: ${updatedUser.id}\n`);
    
    await prisma.$disconnect();
    return updatedUser;
  } catch (error: any) {
    console.error('❌ Error updating email:', error);
    if (error.code === 'P2002') {
      console.log('   Email is already taken by another user.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateUserEmail();

