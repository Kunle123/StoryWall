import { NextRequest, NextResponse } from 'next/server';
import { 
  savePrompt, 
  getPrompt, 
  getLatestPrompt, 
  getAllPrompts, 
  updatePrompt, 
  deletePrompt 
} from '@/lib/utils/promptStorage';

/**
 * Prompt Management API
 * GET: Retrieve prompts
 * POST: Create new prompt
 * PUT: Update existing prompt
 * DELETE: Delete prompt
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step') as 'events' | 'descriptions' | 'images' | null;
    const id = searchParams.get('id');
    const latest = searchParams.get('latest') === 'true';

    if (id) {
      // Get specific prompt
      const prompt = getPrompt(id);
      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ prompt });
    }

    if (latest && step) {
      // Get latest prompt for step
      const prompt = getLatestPrompt(step);
      if (!prompt) {
        return NextResponse.json(
          { error: 'No prompts found for this step' },
          { status: 404 }
        );
      }
      return NextResponse.json({ prompt });
    }

    // Get all prompts (optionally filtered by step)
    const prompts = getAllPrompts(step || undefined);
    return NextResponse.json({ prompts });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, systemPrompt, userPrompt, metadata } = body;

    if (!step) {
      return NextResponse.json(
        { error: 'step is required' },
        { status: 400 }
      );
    }

    const promptId = savePrompt(step, systemPrompt, userPrompt, metadata);
    const prompt = getPrompt(promptId);

    return NextResponse.json({ 
      success: true,
      promptId,
      prompt,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, systemPrompt, userPrompt, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = updatePrompt(id, systemPrompt, userPrompt, metadata);
    if (!updated) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      prompt: updated,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const deleted = deletePrompt(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Prompt deleted',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

