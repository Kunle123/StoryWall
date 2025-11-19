import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice as any,
      input: script,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Upload to Cloudinary as temporary file (24h expiry)
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // Use 'raw' for audio files
          folder: 'temp/voiceovers',
          format: 'mp3',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const audioUrl = (uploadResult as any).secure_url;
    // Note: Duration calculation would require audio analysis
    // For now, estimate based on script length (average ~150 words per minute)
    const estimatedDuration = script.length / 10; // Rough estimate: ~10 chars per second

    return NextResponse.json({
      audioUrl,
      duration: estimatedDuration,
      voice: selectedVoice,
    });
  } catch (error: any) {
    console.error('Error generating voiceover:', error);
    return NextResponse.json(
      { error: 'Failed to generate voiceover', details: error.message },
      { status: 500 }
    );
  }
}

