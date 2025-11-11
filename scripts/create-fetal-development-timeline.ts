/**
 * Script to create a fetal development timeline and track all prompts
 * 
 * This script will:
 * 1. Create a timeline
 * 2. Generate events
 * 3. Generate descriptions (with image prompts)
 * 4. Generate images (with includesPeople=false)
 * 5. Log all prompts for debugging
 */

import { PrismaClient } from '@prisma/client';
import { createTimeline } from '../lib/db/timelines';
import { createEvent } from '../lib/db/events';
import { slugify } from '../lib/utils/slugify';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createFetalDevelopmentTimeline() {
  try {
    console.log('🚀 Starting fetal development timeline creation...\n');

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

    // Step 1: Create the timeline
    console.log('📝 Step 1: Creating timeline...');
    const timeline = await createTimeline({
      title: 'Fetal Development: From Conception to Birth',
      description: 'A comprehensive timeline tracking the development of a human fetus from conception through birth, covering key developmental milestones, organ formation, and physical changes during each stage of pregnancy.',
      slug: slugify('Fetal Development: From Conception to Birth'),
      creator_id: user.id,
      visualization_type: 'horizontal',
      is_public: true,
      is_collaborative: false,
      is_numbered: false,
      hashtags: ['fetal-development', 'pregnancy', 'embryology', 'medical', 'science'],
    });
    console.log(`✅ Timeline created with ID: ${timeline.id}\n`);

    // Step 2: Generate events
    console.log('📅 Step 2: Generating events...');
    const eventsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timelineName: timeline.title,
        timelineDescription: timeline.description,
        maxEvents: 20,
        isFactual: true,
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

    // Create events in database
    const createdEvents = await Promise.all(
      eventsData.events.map((event: any, index: number) => {
        const eventDate = new Date();
        eventDate.setFullYear(event.year || new Date().getFullYear());
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

    // Step 3: Generate descriptions and image prompts
    console.log('📝 Step 3: Generating descriptions and image prompts...');
    const descriptionsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-descriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: createdEvents.map(e => ({ year: e.year, title: e.title })),
        timelineDescription: timeline.description,
        writingStyle: 'professional',
        imageStyle: 'Illustration',
        themeColor: '',
        sourceRestrictions: [],
      }),
    });

    if (!descriptionsResponse.ok) {
      const error = await descriptionsResponse.json();
      throw new Error(`Failed to generate descriptions: ${JSON.stringify(error)}`);
    }

    const descriptionsData = await descriptionsResponse.json();
    console.log(`✅ Generated ${descriptionsData.descriptions.length} descriptions`);
    console.log(`✅ Generated ${descriptionsData.imagePrompts.length} image prompts\n`);

    // Log all image prompts from Step 3
    console.log('📋 Image Prompts from Step 3 (generate-descriptions):');
    descriptionsData.imagePrompts.forEach((prompt: string, idx: number) => {
      console.log(`\n[Event ${idx + 1}] ${createdEvents[idx].title}:`);
      console.log(`  Prompt: ${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`);
      console.log(`  Length: ${prompt.length} characters`);
    });
    console.log('\n');

    // Update events with descriptions and image prompts
    await Promise.all(
      createdEvents.map((event, index) =>
        prisma.event.update({
          where: { id: event.id },
          data: {
            description: descriptionsData.descriptions[index] || '',
            // Note: imagePrompt is not a field in the Event model, we'll store it in a custom field or skip
            // For now, we'll just update the description
          },
        })
      )
    );
    console.log(`✅ Updated events with descriptions\n`);

    // Step 4: Generate images (with includesPeople=false)
    console.log('🎨 Step 4: Generating images (includesPeople=false)...');
    const imagesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: createdEvents.map((e, idx) => ({
          title: e.title,
          description: e.description || '',
          year: new Date(e.date).getFullYear(),
          imagePrompt: descriptionsData.imagePrompts[idx] || null,
        })),
        imageStyle: 'Illustration',
        themeColor: '',
        imageReferences: [],
        referencePhoto: undefined,
        includesPeople: false, // CRITICAL: Set to false for fetal development
      }),
    });

    if (!imagesResponse.ok) {
      const error = await imagesResponse.json();
      throw new Error(`Failed to generate images: ${JSON.stringify(error)}`);
    }

    const imagesData = await imagesResponse.json();
    console.log(`✅ Generated ${imagesData.images.filter((img: string | null) => img !== null).length} images\n`);

    // Log all final prompts from Step 4
    console.log('📋 Final Image Prompts from Step 4 (generate-images):');
    if (imagesData.prompts) {
      imagesData.prompts.forEach((prompt: string | null, idx: number) => {
        if (prompt) {
          console.log(`\n[Event ${idx + 1}] ${createdEvents[idx].title}:`);
          console.log(`  Prompt: ${prompt.substring(0, 300)}${prompt.length > 300 ? '...' : ''}`);
          console.log(`  Length: ${prompt.length} characters`);
          console.log(`  Has person matching: ${prompt.includes('PERSON MATCHING') || prompt.includes('hair color') || prompt.includes('skin tone') ? 'YES ❌' : 'NO ✅'}`);
        }
      });
    }
    console.log('\n');

    // Update events with image URLs
    await Promise.all(
      createdEvents.map((event, index) =>
        prisma.event.update({
          where: { id: event.id },
          data: {
            imageUrl: imagesData.images[index] || null,
          },
        })
      )
    );
    console.log(`✅ Updated events with image URLs\n`);

    // Store prompts in a JSON file for the test page
    const promptsData = {
      timelineId: timeline.id,
      timelineTitle: timeline.title,
      events: createdEvents.map((event, index) => ({
        title: event.title,
        description: descriptionsData.descriptions[index] || '',
        year: new Date(event.date).getFullYear(),
        imageUrl: imagesData.images[index] || null,
        prompt: imagesData.prompts?.[index] || descriptionsData.imagePrompts[index] || '',
        promptFromStep3: descriptionsData.imagePrompts[index] || '',
        promptFromStep4: imagesData.prompts?.[index] || '',
      })),
    };

    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), 'public', 'fetal-timeline-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(promptsData, null, 2));
    console.log(`\n💾 Saved prompts data to: ${outputPath}`);

    console.log('🎉 Timeline creation complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  Timeline ID: ${timeline.id}`);
    console.log(`  Events: ${createdEvents.length}`);
    console.log(`  Descriptions: ${descriptionsData.descriptions.length}`);
    console.log(`  Images: ${imagesData.images.filter((img: string | null) => img !== null).length}`);
    console.log(`\n🔗 View timeline at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/timeline/${timeline.id}`);
    console.log(`🔗 View test page at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/test-fetal-images`);

    return timeline;
  } catch (error: any) {
    console.error('❌ Error creating timeline:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createFetalDevelopmentTimeline()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

