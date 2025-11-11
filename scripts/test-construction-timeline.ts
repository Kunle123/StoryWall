import { PrismaClient } from '@prisma/client';
import { createTimeline } from '../lib/db/timelines';
import { slugify } from '../lib/utils/slugify';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testConstructionTimeline() {
  try {
    console.log('🚀 Starting Liverpool Street Station construction timeline test...\n');

    // Get or create test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    }
    console.log(`👤 Using test user: ${user.id}\n`);

    // Step 1: Create timeline
    console.log('📝 Step 1: Creating timeline...');
    const timeline = await createTimeline({
      title: 'Construction of Liverpool Street Station',
      description: 'A comprehensive timeline tracking the construction phases of Liverpool Street Station, from initial planning through foundation work, structural framing, and final completion.',
      slug: slugify('Construction of Liverpool Street Station'),
      creator_id: user.id,
      visualization_type: 'horizontal',
      isPublic: true,
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
        timelineName: 'Construction of Liverpool Street Station',
        timelineDescription: 'A comprehensive timeline tracking the construction phases of Liverpool Street Station, from initial planning through foundation work, structural framing, and final completion.',
        maxEvents: 15,
        isFactual: true,
        isNumbered: false,
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
      eventsData.events.map(async (event: any) => {
        const eventDate = new Date(event.year, (event.month || 1) - 1, event.day || 1);
        return await prisma.event.create({
          data: {
            timelineId: timeline.id,
            title: event.title,
            date: eventDate,
            description: null, // Will be filled in Step 3
            imageUrl: null,
            createdBy: user.id,
          },
        });
      })
    );
    console.log(`✅ Created ${createdEvents.length} events in database\n`);

    // Step 3: Generate descriptions and image prompts (this is where Knowledge Injection happens)
    console.log('📝 Step 3: Generating descriptions and image prompts (with Knowledge Injection)...');
    const descriptionsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-descriptions`, {
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
    console.log(`✅ Generated ${descriptionsData.imagePrompts.length} image prompts`);
    
    // Check if Anchor was generated (for progression timelines)
    if (descriptionsData.anchorStyle) {
      console.log(`✅ Anchor style generated: ${descriptionsData.anchorStyle.substring(0, 100)}...`);
      console.log(`✅ Progression subject: ${descriptionsData.progressionSubject || 'N/A'}\n`);
    } else {
      console.log(`ℹ️  No Anchor generated (not a progression timeline)\n`);
    }
    
    // Check if factual details were retrieved (Knowledge Injection step)
    if (descriptionsData.factualDetails && Object.keys(descriptionsData.factualDetails).length > 0) {
      console.log(`✅ Knowledge Injection: Retrieved factual details for ${Object.keys(descriptionsData.factualDetails).length} events`);
      console.log(`📋 Sample factual details:`);
      const firstKey = Object.keys(descriptionsData.factualDetails)[0];
      console.log(`   ${firstKey}:`, descriptionsData.factualDetails[firstKey].slice(0, 3).join(', '));
      console.log('');
      
      // Show a few more examples
      const keys = Object.keys(descriptionsData.factualDetails).slice(0, 3);
      keys.forEach(key => {
        console.log(`   ${key}:`);
        descriptionsData.factualDetails[key].slice(0, 3).forEach((fact: string) => {
          console.log(`     - ${fact}`);
        });
      });
      console.log('');
    } else {
      console.log(`⚠️  No factual details retrieved (Knowledge Injection may not have run)\n`);
    }

    // Log sample image prompts to see if factual details are being used
    console.log('📋 Sample Image Prompts from Step 3 (should include factual details):');
    descriptionsData.imagePrompts.slice(0, 3).forEach((prompt: string, idx: number) => {
      console.log(`\n[Event ${idx + 1}] ${createdEvents[idx].title}:`);
      console.log(`  Prompt: ${prompt.substring(0, 300)}${prompt.length > 300 ? '...' : ''}`);
      console.log(`  Length: ${prompt.length} characters`);
    });
    console.log('\n');

    // Update events with descriptions
    await Promise.all(
      createdEvents.map((event, index) =>
        prisma.event.update({
          where: { id: event.id },
          data: {
            description: descriptionsData.descriptions[index] || '',
          },
        })
      )
    );
    console.log(`✅ Updated events with descriptions\n`);

    console.log('🎉 Test complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  Timeline ID: ${timeline.id}`);
    console.log(`  Events: ${createdEvents.length}`);
    console.log(`  Descriptions: ${descriptionsData.descriptions.length}`);
    console.log(`  Image Prompts: ${descriptionsData.imagePrompts.length}`);
    console.log(`  Anchor Style: ${descriptionsData.anchorStyle ? 'Yes' : 'No'}`);
    console.log(`  Factual Details: ${descriptionsData.factualDetails ? Object.keys(descriptionsData.factualDetails).length : 0} events`);
    
    console.log(`\n🔗 View timeline at: http://localhost:3000/timeline/${timeline.id}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testConstructionTimeline();

