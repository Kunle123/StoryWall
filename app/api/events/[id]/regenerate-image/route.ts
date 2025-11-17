import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/db/events';
import { getTimelineById } from '@/lib/db/timelines';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';
import { isAdminEmail } from '@/lib/utils/admin';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    const userProfile = await getUserByClerkId(userId);
    const userEmail = userProfile?.email || null;

    // Get the event
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get the timeline to check ownership and get metadata
    const timeline = await getTimelineById(event.timeline_id);
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // Check if user owns the timeline or is admin
    const isOwner = timeline.creator_id === user.id;
    const isAdmin = userEmail ? isAdminEmail(userEmail) : false;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { timelineId, imageStyle = 'Illustration', themeColor = '' } = body;

    // Check if timeline is published (is_public)
    const isPublished = timeline.is_public || false;

    // Charge 1 credit for AI regeneration if timeline is published
    if (isPublished) {
      // Check user credits
      const userCredits = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      if (!userCredits || userCredits.credits < 1) {
        return NextResponse.json(
          { error: 'Insufficient credits. 1 credit required for image regeneration.' },
          { status: 400 }
        );
      }

      // Deduct 1 credit
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: 1,
          },
        },
      });
    }

    // Use stored imagePrompt if available, otherwise fall back to description/title
    const imagePrompt = (event as any).image_prompt || event.description || event.title;

    // Call the image generation API
    const generateImageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timelineId: timelineId || event.timeline_id,
        events: [{
          id: event.id,
          title: event.title,
          description: event.description || '',
          year: event.date ? new Date(event.date).getFullYear() : undefined,
          month: event.date ? new Date(event.date).getMonth() + 1 : undefined,
          day: event.date ? new Date(event.date).getDate() : undefined,
          number: event.number,
          imagePrompt: imagePrompt, // Use stored prompt if available
        }],
        imageStyle,
        themeColor,
        imageReferences: [], // No reference images for regeneration
        includesPeople: false, // Default to false for regeneration
      }),
    });

    if (!generateImageResponse.ok) {
      const error = await generateImageResponse.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const result = await generateImageResponse.json();
    
    // The result should contain an array of images, get the first one
    const imageUrl = result.images?.[0] || result.imageUrl;

    if (!imageUrl) {
      throw new Error('No image URL returned from generation');
    }

    // Get the prompt that was used (from the generation response)
    const usedPrompt = result.prompts?.[0] || imagePrompt;

    // Update the event with the new image URL and prompt
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        image_prompt: usedPrompt, // Save the prompt that was used
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(error.error || 'Failed to update event with new image');
    }

    return NextResponse.json({ 
      imageUrl,
      creditsDeducted: isPublished ? 1 : 0,
    });
  } catch (error: any) {
    console.error('Error regenerating image:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (error.message === 'Event not found' || error.message === 'Timeline not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to regenerate image' },
      { status: 500 }
    );
  }
}

