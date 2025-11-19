import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('[generate-voiceover] Missing OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'OpenAI API key not configured', details: 'OPENAI_API_KEY environment variable is missing' },
        { status: 500 }
      );
    }

    const { script, voice = 'alloy' } = await request.json();

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script is required and must be a string' },
        { status: 400 }
      );
    }

    if (script.length > 50000) {
      return NextResponse.json(
        { error: 'Script is too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    // Validate voice option
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    console.log('[generate-voiceover] Generating speech:', { scriptLength: script.length, voice: selectedVoice });

    // Generate speech using OpenAI TTS
    let mp3;
    try {
      mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: selectedVoice as any,
        input: script,
      });
      console.log('[generate-voiceover] OpenAI TTS request successful');
    } catch (openaiError: any) {
      console.error('[generate-voiceover] OpenAI TTS error:', openaiError);
      return NextResponse.json(
        { error: 'Failed to generate speech', details: openaiError.message || 'OpenAI API error' },
        { status: 500 }
      );
    }

    // Convert response to buffer
    let buffer;
    try {
      buffer = Buffer.from(await mp3.arrayBuffer());
      console.log('[generate-voiceover] Audio buffer created:', buffer.length, 'bytes');
    } catch (bufferError: any) {
      console.error('[generate-voiceover] Buffer conversion error:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process audio', details: bufferError.message },
        { status: 500 }
      );
    }

    // Check for Cloudinary environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      console.error('[generate-voiceover] Missing Cloudinary credentials:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!cloudinaryApiKey,
        hasApiSecret: !!cloudinaryApiSecret,
      });
      return NextResponse.json(
        { error: 'Cloudinary not configured', details: 'Cloudinary environment variables are missing. Please configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' },
        { status: 500 }
      );
    }

    // Upload to Cloudinary as temporary file (24h expiry)
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    });

    console.log('[generate-voiceover] Uploading to Cloudinary...');
    let uploadResult;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw', // Use 'raw' for audio files
            folder: 'temp/voiceovers',
            format: 'mp3',
          },
          (error: any, result: any) => {
            if (error) {
              console.error('[generate-voiceover] Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('[generate-voiceover] Cloudinary upload successful');
              resolve(result);
            }
          }
        ).end(buffer);
      });
    } catch (cloudinaryError: any) {
      console.error('[generate-voiceover] Cloudinary upload failed:', cloudinaryError);
      return NextResponse.json(
        { error: 'Failed to upload audio', details: cloudinaryError.message || 'Cloudinary upload error' },
        { status: 500 }
      );
    }

    const audioUrl = (uploadResult as any).secure_url;
    // Note: Duration calculation would require audio analysis
    // For now, estimate based on script length (average ~150 words per minute)
    const estimatedDuration = script.length / 10; // Rough estimate: ~10 chars per second

    console.log('[generate-voiceover] Success:', { audioUrl, estimatedDuration, voice: selectedVoice });

    return NextResponse.json({
      audioUrl,
      duration: estimatedDuration,
      voice: selectedVoice,
    });
  } catch (error: any) {
    console.error('[generate-voiceover] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voiceover', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

