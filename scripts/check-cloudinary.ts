/**
 * Script to check Cloudinary for stored images
 */

import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function checkCloudinary() {
  try {
    console.log('Checking Cloudinary for images...\n');
    
    // Get all resources in the default folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500, // Get up to 500 images
    });
    
    console.log(`Found ${result.resources.length} images in Cloudinary\n`);
    
    if (result.resources.length > 0) {
      console.log('Images:');
      result.resources.forEach((resource: any, idx: number) => {
        console.log(`${idx + 1}. ${resource.public_id}`);
        console.log(`   URL: ${resource.secure_url}`);
        console.log(`   Created: ${resource.created_at}`);
        console.log(`   Size: ${(resource.bytes / 1024).toFixed(2)} KB`);
        console.log('');
      });
      
      // Calculate total size
      const totalBytes = result.resources.reduce((sum: number, r: any) => sum + r.bytes, 0);
      console.log(`Total storage used: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('✅ No images stored in Cloudinary');
    }
  } catch (error: any) {
    console.error('Error checking Cloudinary:', error.message);
    throw error;
  }
}

checkCloudinary();

