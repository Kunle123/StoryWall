/**
 * Script to create a Die Hard timeline using mood-based, archetypal approach
 * 
 * This script tests the new approach for film/cultural commentary:
 * - No person matching or reference images
 * - Mood-based, archetypal visuals
 * - Artistic styles (not photorealistic)
 * - Focus on atmosphere and emotional tone
 */

import { PrismaClient } from '@prisma/client';
import { createTimeline } from '../lib/db/timelines';
import { createEvent } from '../lib/db/events';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createDieHardTimeline() {
  try {
    console.log('🎬 Starting Die Hard mood-based timeline creation...\n');

    // Get or create a test user
    console.log('👤 Getting test user...');
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: 'test-user-clerk-id' },
          { email: 'test@example.com' },
        ],
      },
    });

    if (!user) {
      console.log('⚠️  Test user not found. Creating one...');
      user = await prisma.user.create({
        data: {
          clerkId: 'test-user-clerk-id',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
          credits: 2000,
        },
      });
      console.log(`✅ Test user created: ${user.id}\n`);
    } else {
      console.log(`✅ Test user found: ${user.id}\n`);
    }

    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Step 1: Create timeline
    console.log('📋 Step 1: Creating timeline...');
    const timeline = await createTimeline({
      title: 'Die Hard: A Mood-Based Visual Review',
      description: 'A critical review and visual commentary of the 1988 action film Die Hard, using mood-matched archetypal imagery to capture the emotional journey and thematic elements without recreating specific actor likenesses.',
      created_by: user.id,
      is_factual: false,
      is_numbered: false,
      image_style: 'Illustration', // Use artistic style, not photorealistic
      theme_color: '#DC2626', // Red theme for action/tension
    });
    console.log(`✅ Timeline created: ${timeline.id} - "${timeline.title}"\n`);

    // Step 2: Generate events (key moments from the film)
    console.log('📅 Step 2: Generating events (key moments from Die Hard)...');
    const eventsResponse = await fetch(`${apiUrl}/api/ai/generate-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timelineName: timeline.title,
        timelineDescription: 'A critical review of the 1988 action film Die Hard. Generate 20 key moments from the film\'s narrative, focusing on plot points, emotional beats, and thematic elements. Each event should represent a significant moment in the story.',
        maxEvents: 20,
        isFactual: false, // This is a review/commentary, not factual
        isNumbered: false,
        sourceRestrictions: [],
      }),
    });

    if (!eventsResponse.ok) {
      const error = await eventsResponse.json();
      throw new Error(`Failed to generate events: ${JSON.stringify(error)}`);
    }

    const eventsData = await eventsResponse.json();
    console.log(`✅ Generated ${eventsData.events.length} events\n`);
    console.log('📝 Events:');
    eventsData.events.forEach((e: any, i: number) => {
      console.log(`   ${i + 1}. ${e.year}: ${e.title}`);
    });
    console.log('');

    // Create events in database
    const createdEvents = await Promise.all(
      eventsData.events.map((event: any, index: number) => {
        const eventDate = new Date();
        eventDate.setFullYear(event.year || 1988);
        return createEvent({
          timeline_id: timeline.id,
          title: event.title,
          date: eventDate,
          description: null, // Will be filled in Step 3
          image_url: null,
          created_by: user.id,
        });
      })
    );
    console.log(`✅ Created ${createdEvents.length} events in database\n`);

    // Step 3: Generate descriptions and mood-based image prompts
    console.log('📝 Step 3: Generating descriptions and mood-based image prompts...');
    console.log('   🎨 Using mood-based approach: archetypal characters, emotional atmosphere, no specific likenesses\n');
    
    const descriptionsResponse = await fetch(`${apiUrl}/api/ai/generate-descriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: createdEvents.map(e => ({ 
          year: new Date(e.date).getFullYear(), 
          title: e.title 
        })),
        timelineDescription: timeline.description,
        writingStyle: 'narrative', // Review-style narrative
        imageStyle: 'Illustration', // Artistic style
        themeColor: '#DC2626', // Red for tension/action
        sourceRestrictions: [],
      }),
    });

    if (!descriptionsResponse.ok) {
      const error = await descriptionsResponse.json();
      throw new Error(`Failed to generate descriptions: ${JSON.stringify(error)}`);
    }

    const descriptionsData = await descriptionsResponse.json();
    console.log(`✅ Generated ${descriptionsData.descriptions.length} descriptions\n`);
    console.log(`✅ Generated ${descriptionsData.imagePrompts?.length || 0} image prompts\n`);

    // Update events with descriptions and image prompts
    for (let i = 0; i < createdEvents.length; i++) {
      const event = createdEvents[i];
      const description = descriptionsData.descriptions[i] || '';
      const imagePrompt = descriptionsData.imagePrompts?.[i] || '';

      await prisma.event.update({
        where: { id: event.id },
        data: {
          description,
          imagePrompt, // Store the mood-based prompt
        },
      });
    }
    console.log(`✅ Updated events with descriptions and image prompts\n`);

    // Log sample prompts for review
    console.log('📋 Sample Image Prompts (mood-based, archetypal):');
    console.log('─'.repeat(80));
    descriptionsData.imagePrompts?.slice(0, 3).forEach((prompt: string, i: number) => {
      console.log(`\n${i + 1}. ${createdEvents[i].title}:`);
      console.log(`   ${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`);
    });
    console.log('\n' + '─'.repeat(80) + '\n');

    // Step 4: Generate mood-based images (NO person matching)
    console.log('🎨 Step 4: Generating mood-based, archetypal images...');
    console.log('   ⚠️  CRITICAL: Using mood-based approach - NO person matching, NO reference images\n');
    
    const imagesResponse = await fetch(`${apiUrl}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: createdEvents.map(e => ({
          title: e.title,
          description: e.description || '',
          year: new Date(e.date).getFullYear(),
          imagePrompt: e.imagePrompt || '',
        })),
        imageStyle: 'Illustration', // Artistic style
        themeColor: '#DC2626',
        imageReferences: [], // NO reference images for mood-based approach
        includesPeople: false, // CRITICAL: Disable person matching
        referencePhoto: undefined, // No reference photo
      }),
    });

    if (!imagesResponse.ok) {
      const error = await imagesResponse.json();
      throw new Error(`Failed to generate images: ${JSON.stringify(error)}`);
    }

    const imagesData = await imagesResponse.json();
    console.log(`✅ Generated ${imagesData.images?.filter((img: any) => img !== null).length || 0} images\n`);

    // Update events with image URLs
    let imagesSaved = 0;
    for (let i = 0; i < createdEvents.length; i++) {
      const event = createdEvents[i];
      const imageUrl = imagesData.images?.[i] || null;

      if (imageUrl) {
        await prisma.event.update({
          where: { id: event.id },
          data: { imageUrl },
        });
        imagesSaved++;
      }
    }
    console.log(`✅ Saved ${imagesSaved} images to events\n`);

    // Final summary
    console.log('\n' + '═'.repeat(80));
    console.log('✅ DIE HARD MOOD-BASED TIMELINE CREATION COMPLETE');
    console.log('═'.repeat(80));
    console.log(`📋 Timeline ID: ${timeline.id}`);
    console.log(`📋 Timeline Title: ${timeline.title}`);
    console.log(`📅 Events: ${createdEvents.length}`);
    console.log(`🎨 Images: ${imagesSaved}`);
    console.log(`🌐 View at: ${apiUrl}/timeline/${timeline.id}`);
    console.log('═'.repeat(80) + '\n');

    console.log('📝 KEY FEATURES OF THIS APPROACH:');
    console.log('   ✓ Mood-based, archetypal imagery (no specific actor likenesses)');
    console.log('   ✓ Artistic illustration style (not photorealistic)');
    console.log('   ✓ Focus on emotional atmosphere and thematic elements');
    console.log('   ✓ Positioned as critical review/commentary (Fair Use)');
    console.log('   ✓ No person matching or reference images used\n');

  } catch (error: any) {
    console.error('❌ Error creating Die Hard timeline:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDieHardTimeline()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

