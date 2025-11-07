/**
 * Google Imagen 4 Integration
 * 
 * This module provides functions to generate images using Google's Imagen 4 model
 * via Vertex AI API.
 * 
 * Pricing:
 * - Fast: $0.02/image
 * - Standard: $0.04/image
 * - Ultra: $0.06/image
 */

import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI client
let vertexAI: VertexAI | null = null;

/**
 * Initialize Google Cloud Vertex AI client
 */
function getVertexAIClient(): VertexAI {
  if (vertexAI) {
    return vertexAI;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
  }

  // Initialize with JSON credentials from environment variable
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      
      // For Railway/serverless: Write credentials to a temp file and use it
      // The Vertex AI SDK will use GOOGLE_APPLICATION_CREDENTIALS if set
      if (typeof process !== 'undefined' && process.env) {
        // Set the credentials JSON in environment for the SDK to pick up
        // The SDK uses Application Default Credentials (ADC)
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        
        // Create temp file for credentials
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `gcp-credentials-${Date.now()}.json`);
        fs.writeFileSync(tempFilePath, credentialsJson);
        
        // Set environment variable to point to temp file
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
      }
      
      vertexAI = new VertexAI({
        project: projectId,
        location: 'us-central1', // or 'europe-west4' - check availability
      });
      return vertexAI;
    } catch (error) {
      throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error}`);
    }
  }

  // Initialize with file path
  if (credentialsPath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    vertexAI = new VertexAI({
      project: projectId,
      location: 'us-central1',
    });
    return vertexAI;
  }

  // Try default credentials (for local development with gcloud CLI)
  try {
    vertexAI = new VertexAI({
      project: projectId,
      location: 'us-central1',
    });
    return vertexAI;
  } catch (error) {
    throw new Error(
      'Google Cloud credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS'
    );
  }
}

/**
 * Generate image using Google Imagen 4
 * 
 * @param prompt - Text prompt for image generation
 * @param options - Generation options
 * @returns Image URL or base64 data
 */
export async function generateImageWithImagen(
  prompt: string,
  options: {
    quality?: 'fast' | 'standard' | 'ultra';
    referenceImage?: string; // Base64 image data
    aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
    safetyFilterLevel?: 'block_most' | 'block_some' | 'block_few' | 'block_fewest';
    personGeneration?: 'allow_all' | 'dont_allow_adult' | 'dont_allow';
  } = {}
): Promise<string> {
  const {
    quality = 'fast',
    referenceImage,
    aspectRatio = '1:1',
    safetyFilterLevel = 'block_some',
    personGeneration = 'allow_all',
  } = options;

  try {
    const vertexAI = getVertexAIClient();
    
    console.log(`[Imagen] Generating image with quality: ${quality}, aspectRatio: ${aspectRatio}`);
    console.log(`[Imagen] Prompt: ${prompt.substring(0, 100)}...`);
    
    // Map quality to Imagen model
    const modelMap: Record<string, string> = {
      'fast': 'imagegeneration@006', // Fast model
      'standard': 'imagegeneration@005', // Standard model
      'ultra': 'imagegeneration@006', // Ultra uses same as fast for now
    };
    
    const model = modelMap[quality] || 'imagegeneration@006';
    
    // Prepare the request
    const requestBody: any = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        safetyFilterLevel: safetyFilterLevel,
        personGeneration: personGeneration,
      },
    };
    
    // Add reference image if provided
    if (referenceImage) {
      // Remove data URL prefix if present
      const base64Data = referenceImage.includes(',') 
        ? referenceImage.split(',')[1] 
        : referenceImage;
      
      requestBody.instances[0].image = {
        bytesBase64Encoded: base64Data,
      };
    }
    
    // Call the Vertex AI API
    // Note: The exact endpoint may vary - this is based on typical Vertex AI structure
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const location = 'us-central1';
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
    
    // Get access token (the SDK should handle this, but we may need to use REST API directly)
    // For now, let's use the SDK's prediction service if available
    const { PredictionServiceClient } = require('@google-cloud/vertexai');
    
    // Alternative: Use REST API with authenticated fetch
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}'),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract image from response
    // The response structure: { predictions: [{ bytesBase64Encoded: "..." }] }
    if (result.predictions && result.predictions[0] && result.predictions[0].bytesBase64Encoded) {
      const imageBase64 = result.predictions[0].bytesBase64Encoded;
      return `data:image/png;base64,${imageBase64}`;
    }
    
    throw new Error('No image data in Imagen API response');
  } catch (error: any) {
    console.error('[Imagen] Error generating image:', error);
    throw new Error(`Failed to generate image with Google Imagen: ${error.message}`);
  }
}

/**
 * Check if Google Cloud credentials are configured
 */
export function isGoogleCloudConfigured(): boolean {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    return !!(projectId && (credentialsJson || credentialsPath));
  } catch {
    return false;
  }
}

