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
      // Handle JSON that might be stored as a string with escaped quotes
      let jsonString = credentialsJson.trim();
      
      // Remove surrounding quotes if present (single or double)
      // Check for balanced quotes at start and end
      if (jsonString.length > 2) {
        if ((jsonString.startsWith('"') && jsonString.endsWith('"')) || 
            (jsonString.startsWith("'") && jsonString.endsWith("'"))) {
          jsonString = jsonString.slice(1, -1);
        }
      }
      
      // Handle actual newlines in the JSON (if it's formatted with line breaks)
      // First, try to parse as-is (in case it's already valid JSON with escaped newlines)
      // If that fails, remove actual newlines and try again
      let parsedCredentials;
      try {
        parsedCredentials = JSON.parse(jsonString);
      } catch (firstError) {
        // If parsing fails, try removing actual newlines and whitespace
        const cleanedJson = jsonString.replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '').trim();
        try {
          parsedCredentials = JSON.parse(cleanedJson);
          jsonString = cleanedJson; // Use cleaned version
        } catch (secondError) {
          // Still failed, throw original error
          throw firstError;
        }
      }
      
      const credentials = parsedCredentials;
      
      // If it still looks like it has escaped quotes, try to unescape
      if (jsonString.includes('\\"')) {
        jsonString = jsonString.replace(/\\"/g, '"');
      }
      if (jsonString.includes("\\'")) {
        jsonString = jsonString.replace(/\\'/g, "'");
      }
      
      // Credentials already parsed above
      
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
    } catch (error: any) {
      // Provide more helpful error message
      const errorMsg = error.message || String(error);
      const jsonPreview = credentialsJson.substring(0, 100);
      throw new Error(
        `Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ${errorMsg}\n` +
        `JSON preview: ${jsonPreview}...\n` +
        `Make sure the JSON is properly formatted in .env.local (no extra quotes, proper escaping)`
      );
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
    personGeneration = 'dont_allow_adult', // Changed from 'allow_all' - not available for most accounts
  } = options;

  try {
    const vertexAI = getVertexAIClient();
    
    console.log(`[Imagen] Generating image with quality: ${quality}, aspectRatio: ${aspectRatio}`);
    console.log(`[Imagen] Prompt: ${prompt.substring(0, 100)}...`);
    
    // Map quality to Imagen model
    // Imagen 4 model name: imagen-4.0-generate-001
    // Quality is controlled via parameters, not different models
    const model = 'imagen-4.0-generate-001';
    
    // Prepare the request - Imagen 4 uses a specific format
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
    
    // Call the Vertex AI API for Imagen
    // Imagen 4 uses a different endpoint structure
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const location = 'us-central1';
    
    // Try different possible endpoint formats for Imagen
    // Format 1: Standard Vertex AI predict endpoint
    let endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
    
    // Alternative format if the above doesn't work
    // Format 2: imagegeneration endpoint (if different)
    // endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration-006:predict`;
    
    console.log(`[Imagen] Calling endpoint: ${endpoint.substring(0, 100)}...`);
    console.log(`[Imagen] Request body:`, JSON.stringify(requestBody).substring(0, 200));
    
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
    
    // Log the response structure for debugging
    console.log(`[Imagen] API response structure:`, JSON.stringify(result).substring(0, 500));
    
    // Extract image from response
    // The response structure may vary - check different possible formats
    let imageBase64: string | null = null;
    
    // Format 1: { predictions: [{ bytesBase64Encoded: "..." }] }
    if (result.predictions && result.predictions[0]) {
      if (result.predictions[0].bytesBase64Encoded) {
        imageBase64 = result.predictions[0].bytesBase64Encoded;
      } else if (result.predictions[0].image) {
        // Format 2: { predictions: [{ image: "base64..." }] }
        imageBase64 = result.predictions[0].image;
      } else if (typeof result.predictions[0] === 'string') {
        // Format 3: { predictions: ["base64..."] }
        imageBase64 = result.predictions[0];
      }
    }
    
    // Format 4: Direct base64 in response
    if (!imageBase64 && result.image) {
      imageBase64 = result.image;
    }
    
    // Format 5: { output: "base64..." }
    if (!imageBase64 && result.output) {
      imageBase64 = result.output;
    }
    
    if (imageBase64) {
      // Remove data URL prefix if present
      if (imageBase64.startsWith('data:image')) {
        return imageBase64;
      }
      return `data:image/png;base64,${imageBase64}`;
    }
    
    // If we get here, log the full response for debugging
    console.error('[Imagen] Full API response:', JSON.stringify(result, null, 2));
    throw new Error('No image data in Imagen API response - check response structure');
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

