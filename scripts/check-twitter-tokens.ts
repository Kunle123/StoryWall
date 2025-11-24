/**
 * Script to check Twitter token status for a user
 * 
 * Usage:
 * npx tsx scripts/check-twitter-tokens.ts
 * 
 * This will check if the user has:
 * - OAuth 2.0 token (for posting tweets)
 * - OAuth 1.0a tokens (for image uploads)
 */

import 'dotenv/config';
import { prisma } from '@/lib/db/prisma';

async function checkTwitterTokens() {
  try {
    // Find user by email
    const email = 'kunle2000@gmail.com';
    
    console.log(`🔍 Checking Twitter tokens for: ${email}\n`);
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        clerkId: true,
        twitterAccessToken: true,
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Clerk ID: ${user.clerkId}\n`);
    
    // Check OAuth 2.0 (for posting tweets)
    const hasOAuth2 = !!user.twitterAccessToken;
    console.log(`OAuth 2.0 (Posting Tweets):`);
    console.log(`   Status: ${hasOAuth2 ? '✅ Connected' : '❌ Not connected'}`);
    if (hasOAuth2) {
      console.log(`   Token: ${user.twitterAccessToken.substring(0, 20)}...`);
    }
    
    // Check OAuth 1.0a (for image uploads)
    const hasOAuth1 = !!user.twitterOAuth1Token && !!user.twitterOAuth1TokenSecret;
    console.log(`\nOAuth 1.0a (Image Uploads):`);
    console.log(`   Status: ${hasOAuth1 ? '✅ Configured' : '❌ Not configured'}`);
    if (hasOAuth1) {
      console.log(`   Token: ${user.twitterOAuth1Token.substring(0, 20)}...`);
      console.log(`   Secret: ${user.twitterOAuth1TokenSecret.substring(0, 20)}...`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Can post tweets: ${hasOAuth2 ? '✅ Yes' : '❌ No'}`);
    console.log(`   Can upload images: ${hasOAuth1 ? '✅ Yes' : '❌ No'}`);
    
    if (!hasOAuth2) {
      console.log(`\n⚠️  Action needed: Connect Twitter account (OAuth 2.0)`);
    }
    if (!hasOAuth1) {
      console.log(`\n⚠️  Action needed: Enable image upload (OAuth 1.0a)`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTwitterTokens();

