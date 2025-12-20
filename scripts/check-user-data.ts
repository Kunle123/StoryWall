import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function checkUserData() {
  try {
    const email = 'kunle2000@gmail.com';
    
    console.log(`🔍 Checking account data for: ${email}\n`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        timelines: {
          include: {
            events: {
              orderBy: { date: 'asc' },
            },
            categories: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" not found in database.\n`);
      
      // Check if there are any similar emails
      console.log('🔍 Checking for similar emails...');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          clerkId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      console.log(`\n📋 Found ${allUsers.length} recent users:`);
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (username: ${u.username}, clerkId: ${u.clerkId?.substring(0, 20)}...)`);
      });
      
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log('✅ User found!\n');
    console.log('📊 User Information:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Avatar URL: ${user.avatarUrl || 'None'}`);
    console.log(`   Bio: ${user.bio || 'None'}`);
    console.log(`   Credits: ${user.credits}`);
    console.log(`   Terms Accepted: ${user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : 'Not accepted'}`);
    console.log(`   Created At: ${user.createdAt.toISOString()}`);
    console.log(`   Updated At: ${user.updatedAt.toISOString()}`);

    // Check timelines
    const timelineCount = user.timelines?.length || 0;
    console.log(`\n📚 Timelines: ${timelineCount}`);
    
    if (timelineCount > 0) {
      user.timelines.forEach((timeline, index) => {
        const eventCount = timeline.events?.length || 0;
        console.log(`\n   Timeline ${index + 1}:`);
        console.log(`      ID: ${timeline.id}`);
        console.log(`      Title: ${timeline.title}`);
        console.log(`      Slug: ${timeline.slug}`);
        console.log(`      Public: ${timeline.isPublic}`);
        console.log(`      Featured: ${timeline.isFeatured || false}`);
        console.log(`      Events: ${eventCount}`);
        console.log(`      Created: ${timeline.createdAt.toISOString()}`);
        
        if (eventCount > 0) {
          console.log(`      Event titles:`);
          timeline.events.slice(0, 5).forEach((event, eIndex) => {
            console.log(`         ${eIndex + 1}. ${event.title} (${event.date})`);
          });
          if (eventCount > 5) {
            console.log(`         ... and ${eventCount - 5} more`);
          }
        }
      });
    } else {
      console.log('   No timelines found.');
    }

    // Check for any related data
    const eventCount = await prisma.event.count({
      where: { createdBy: user.id },
    });
    
    const categoryCount = await prisma.category.count({
      where: { timeline: { creatorId: user.id } },
    });

    console.log(`\n📈 Additional Statistics:`);
    console.log(`   Total Events Created: ${eventCount}`);
    console.log(`   Total Categories: ${categoryCount}`);

    // Check for any Twitter/TikTok connections
    const hasTwitterToken = !!user.twitterAccessToken;
    const hasTikTokToken = !!user.tiktokAccessToken;
    
    console.log(`\n🔗 Connected Services:`);
    console.log(`   Twitter: ${hasTwitterToken ? 'Connected' : 'Not connected'}`);
    console.log(`   TikTok: ${hasTikTokToken ? 'Connected' : 'Not connected'}`);

    await prisma.$disconnect();
    console.log('\n✅ Check complete!');
  } catch (error: any) {
    console.error('❌ Error checking user data:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUserData();

