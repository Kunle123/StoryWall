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

    const { script, scripts, voice = 'alloy' } = await request.json();

    // Support both single script and batch of scripts
    let scriptsToProcess: string[] = [];
    if (scripts && Array.isArray(scripts)) {
      // Batch mode: multiple scripts
      scriptsToProcess = scripts;
    } else if (script && typeof script === 'string') {
      // Single script mode (backward compatible)
      scriptsToProcess = [script];
    } else {
      return NextResponse.json(
        { error: 'Script or scripts array is required' },
        { status: 400 }
      );
    }

    // Validate total length
    const totalLength = scriptsToProcess.reduce((sum, s) => sum + s.length, 0);
    if (totalLength > 50000) {
      return NextResponse.json(
        { error: 'Total script length is too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    // OpenAI TTS has a 4096 character limit per request
    // If batch mode and combined script exceeds limit, split into multiple batches
    const OPENAI_TTS_MAX_CHARS = 4096;
    const separator = ' ... ';
    const separatorLength = separator.length;
    
    // Validate voice option (must be declared before use in batch processing)
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';
    
    let isBatch = scriptsToProcess.length > 1;
    let combinedScript: string;
    let segmentDurations: number[] = [];
    let segmentBoundaries: number[] = [0];
    
    if (isBatch) {
      // Try to combine all scripts
      const testCombined = scriptsToProcess.join(separator);
      
      if (testCombined.length <= OPENAI_TTS_MAX_CHARS) {
        // All scripts fit in one request
        combinedScript = testCombined;
      } else {
        // Need to split into multiple batches
        console.log(`[generate-voiceover] Combined script (${testCombined.length} chars) exceeds OpenAI TTS limit (${OPENAI_TTS_MAX_CHARS}), splitting into batches`);
        
        // Split scripts into batches that fit within the limit
        const batches: string[][] = [];
        let currentBatch: string[] = [];
        let currentBatchLength = 0;
        
        for (const script of scriptsToProcess) {
          const scriptWithSeparator = currentBatch.length > 0 ? separator + script : script;
          const newLength = currentBatchLength + scriptWithSeparator.length;
          
          if (newLength <= OPENAI_TTS_MAX_CHARS && currentBatch.length < 10) {
            // Add to current batch
            currentBatch.push(script);
            currentBatchLength = newLength;
          } else {
            // Start new batch
            if (currentBatch.length > 0) {
              batches.push(currentBatch);
            }
            currentBatch = [script];
            currentBatchLength = script.length;
          }
        }
        
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
        }
        
        console.log(`[generate-voiceover] Split ${scriptsToProcess.length} scripts into ${batches.length} batches`);
        
        // Initialize Cloudinary for batch uploads
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
        const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
        const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
        
        if (!cloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
          return NextResponse.json(
            { error: 'Cloudinary not configured', details: 'Cloudinary environment variables are missing' },
            { status: 500 }
          );
        }
        
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: cloudName,
          api_key: cloudinaryApiKey,
          api_secret: cloudinaryApiSecret,
        });
        
        // Generate audio for each batch and combine
        const batchAudioUrls: string[] = [];
        const batchDurations: number[] = [];
        
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchScript = batch.join(separator);
          
          console.log(`[generate-voiceover] Generating batch ${i + 1}/${batches.length} (${batch.length} scripts, ${batchScript.length} chars)`);
          
          const batchMp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: selectedVoice as any,
            input: batchScript,
          });
          
          const batchBuffer = Buffer.from(await batchMp3.arrayBuffer());
          
          // Upload batch audio to Cloudinary
          const batchUploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'temp/voiceovers',
                format: 'mp3',
              },
              (error: any, result: any) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(batchBuffer);
          });
          
          const batchAudioUrl = (batchUploadResult as any).secure_url;
          batchAudioUrls.push(batchAudioUrl);
          
          // Calculate duration for each script in this batch
          const charsPerSecond = 10;
          batch.forEach(script => {
            const scriptDuration = script.length / charsPerSecond;
            batchDurations.push(scriptDuration);
          });
        }
        
        // Combine all batch audio files using FFmpeg (we'll do this client-side)
        // For now, return the first batch URL and all durations
        // The client will need to combine them
        combinedScript = batches[0].join(separator); // Use first batch for initial response
        segmentDurations = batchDurations;
        
        // Calculate boundaries
        let currentTime = 0;
        segmentBoundaries = [0];
        for (let i = 0; i < segmentDurations.length - 1; i++) {
          currentTime += segmentDurations[i] + (separatorLength / 10); // Add separator duration
          segmentBoundaries.push(currentTime);
        }
        
        // Return batch URLs for client-side combination
        return NextResponse.json({
          audioUrl: batchAudioUrls[0], // First batch URL (client will combine)
          batchAudioUrls, // All batch URLs for client to combine
          duration: batchDurations.reduce((sum, d) => sum + d, 0),
          segmentDurations,
          segmentBoundaries,
          voice: selectedVoice,
          isBatch: true,
          requiresClientCombination: true, // Flag to indicate client needs to combine batches
        });
      }
    } else {
      // Single script mode
      combinedScript = scriptsToProcess[0];
    }

    console.log('[generate-voiceover] Generating speech:', { 
      scriptCount: scriptsToProcess.length,
      totalLength: combinedScript.length,
      isBatch,
      voice: selectedVoice 
    });

    // Generate speech using OpenAI TTS (one call for all scripts)
    let mp3;
    try {
      mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: selectedVoice as any,
        input: combinedScript,
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
    // Support both NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and CLOUDINARY_CLOUD_NAME
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      console.error('[generate-voiceover] Missing Cloudinary credentials:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!cloudinaryApiKey,
        hasApiSecret: !!cloudinaryApiSecret,
        envVars: {
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
        },
      });
      return NextResponse.json(
        { error: 'Cloudinary not configured', details: 'Cloudinary environment variables are missing. Please configure CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' },
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
    
    // Calculate durations for each segment
    // Estimate: ~10 chars per second (conservative estimate)
    const charsPerSecond = 10;
    const totalDuration = combinedScript.length / charsPerSecond;
    
    // For batch mode, calculate segment boundaries and durations
    if (isBatch) {
      segmentDurations = [];
      segmentBoundaries = [0]; // Reset to start times for each segment
      let currentTime = 0;
      for (let i = 0; i < scriptsToProcess.length; i++) {
        const segmentLength = scriptsToProcess[i].length;
        const segmentDuration = segmentLength / charsPerSecond;
        segmentDurations.push(segmentDuration);
        if (i < scriptsToProcess.length - 1) {
          // Add separator duration (3 chars for " ... ")
          const separatorDuration = 3 / charsPerSecond;
          currentTime += segmentDuration + separatorDuration;
          segmentBoundaries.push(currentTime);
        }
      }
    } else {
      // Single script mode
      segmentDurations = [totalDuration];
      // segmentBoundaries not needed for single script
    }

    console.log('[generate-voiceover] Success:', { 
      audioUrl, 
      totalDuration,
      segmentCount: segmentDurations.length,
      segmentDurations,
      segmentBoundaries: isBatch ? segmentBoundaries : undefined,
      voice: selectedVoice 
    });

    return NextResponse.json({
      audioUrl,
      duration: totalDuration, // Total duration
      segmentDurations, // Individual segment durations
      segmentBoundaries: isBatch ? segmentBoundaries : undefined, // Start times for splitting
      voice: selectedVoice,
      isBatch,
    });
  } catch (error: any) {
    console.error('[generate-voiceover] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voiceover', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

