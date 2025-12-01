import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { initVideoUpload, refreshTikTokToken } from '@/lib/tiktok/api';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Initialize TikTok video upload
 * Returns upload URL and publish_id for client-side upload
 */
export async function POST(request: NextRequest) {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Get user's TikTok tokens from database
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        tiktokAccessToken: true,
        tiktokRefreshToken: true,
        tiktokOpenId: true,
      },
    });
    
    if (!userWithToken?.tiktokAccessToken || !userWithToken?.tiktokOpenId) {
      return NextResponse.json(
        { error: 'TikTok not connected. Please connect your TikTok account first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, privacy_level, disable_duet, disable_comment, disable_stitch } = body;
    
    let accessToken = userWithToken.tiktokAccessToken;
    let openId = userWithToken.tiktokOpenId;
    
    // Try to initialize upload
    try {
      const initResponse = await initVideoUpload(
        accessToken,
        openId,
        {
          title: title || '',
          privacy_level: privacy_level || 'PUBLIC_TO_EVERYONE',
          disable_duet: disable_duet || false,
          disable_comment: disable_comment || false,
          disable_stitch: disable_stitch || false,
        }
      );

      return NextResponse.json({
        success: true,
        publish_id: initResponse.data.publish_id,
        upload_url: initResponse.data.upload_url,
        message: 'Video upload initialized. Upload the video file to the provided URL using PUT request.',
      });
    } catch (error: any) {
      // If token expired, try to refresh
      if (error.message?.includes('401') || error.message?.includes('invalid_token') || error.message?.includes('expired')) {
        console.log('[TikTok Post Video] Token expired, attempting refresh...');
        
        if (!userWithToken.tiktokRefreshToken) {
          // Clear tokens and prompt for reconnection
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tiktokAccessToken: null,
              tiktokRefreshToken: null,
              tiktokOpenId: null,
            },
          });
          
          return NextResponse.json(
            { 
              error: 'TikTok access token expired. Please reconnect your TikTok account.',
              requiresReconnect: true,
            },
            { status: 401 }
          );
        }

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        
        if (!clientKey || !clientSecret) {
          return NextResponse.json(
            { error: 'TikTok not configured properly.' },
            { status: 500 }
          );
        }

        try {
          const tokenData = await refreshTikTokToken(
            clientKey,
            clientSecret,
            userWithToken.tiktokRefreshToken
          );

          // Store new tokens
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tiktokAccessToken: tokenData.access_token,
              tiktokRefreshToken: tokenData.refresh_token,
              tiktokOpenId: tokenData.open_id,
            },
          });

          accessToken = tokenData.access_token;
          openId = tokenData.open_id;

          // Retry upload initialization
          const initResponse = await initVideoUpload(
            accessToken,
            openId,
            {
              title: title || '',
              privacy_level: privacy_level || 'PUBLIC_TO_EVERYONE',
              disable_duet: disable_duet || false,
              disable_comment: disable_comment || false,
              disable_stitch: disable_stitch || false,
            }
          );

          return NextResponse.json({
            success: true,
            publish_id: initResponse.data.publish_id,
            upload_url: initResponse.data.upload_url,
            message: 'Video upload initialized. Upload the video file to the provided URL using PUT request.',
          });
        } catch (refreshError: any) {
          console.error('[TikTok Post Video] Token refresh failed:', refreshError);
          
          // Clear tokens and prompt for reconnection
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tiktokAccessToken: null,
              tiktokRefreshToken: null,
              tiktokOpenId: null,
            },
          });
          
          return NextResponse.json(
            { 
              error: 'TikTok token refresh failed. Please reconnect your TikTok account.',
              requiresReconnect: true,
            },
            { status: 401 }
          );
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  } catch (error: any) {
    console.error('[TikTok Post Video] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize TikTok video upload' },
      { status: 500 }
    );
  }
}

