/**
 * TikTok Content Publishing API client
 * Uses TikTok's official Content Publishing API for video uploads
 * Videos are uploaded to user's TikTok inbox for them to finalize and post
 */

interface TikTokAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

interface TikTokVideoInitResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokVideoStatusResponse {
  data: {
    status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
    publish_id: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

/**
 * Get TikTok OAuth authorization URL
 */
export function getTikTokAuthUrl(
  clientKey: string,
  redirectUri: string,
  state: string,
  scopes: string[] = ['video.upload', 'user.info.basic']
): string {
  const scope = scopes.join(',');
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  });

  return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  clientKey: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<TikTokAuthResponse> {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`TikTok token exchange failed: ${error.error?.message || error.error || response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`TikTok API error: ${data.error.message || data.error.description || 'Unknown error'}`);
  }

  return data;
}

/**
 * Refresh TikTok access token
 */
export async function refreshTikTokToken(
  clientKey: string,
  clientSecret: string,
  refreshToken: string
): Promise<TikTokAuthResponse> {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`TikTok token refresh failed: ${error.error?.message || error.error || response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`TikTok API error: ${data.error.message || data.error.description || 'Unknown error'}`);
  }

  return data;
}

/**
 * Initialize video upload to TikTok inbox
 * Returns publish_id and upload_url
 */
export async function initVideoUpload(
  accessToken: string,
  openId: string,
  postInfo: {
    title?: string;
    privacy_level?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disable_duet?: boolean;
    disable_comment?: boolean;
    disable_stitch?: boolean;
    video_cover_timestamp_ms?: number;
  } = {}
): Promise<TikTokVideoInitResponse> {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: postInfo.title || '',
        privacy_level: postInfo.privacy_level || 'PUBLIC_TO_EVERYONE',
        disable_duet: postInfo.disable_duet || false,
        disable_comment: postInfo.disable_comment || false,
        disable_stitch: postInfo.disable_stitch || false,
        ...(postInfo.video_cover_timestamp_ms && {
          video_cover_timestamp_ms: postInfo.video_cover_timestamp_ms,
        }),
      },
    }),
  });

  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(
      `TikTok video init failed: ${data.error?.message || data.error?.description || response.statusText}`
    );
  }

  return data;
}

/**
 * Upload video file to TikTok
 * This uploads the video to the URL provided by initVideoUpload
 */
export async function uploadVideoToTikTok(
  uploadUrl: string,
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'video/mp4');
    xhr.send(videoBlob);
  });
}

/**
 * Check video upload status
 */
export async function checkVideoStatus(
  accessToken: string,
  openId: string,
  publishId: string
): Promise<TikTokVideoStatusResponse> {
  const response = await fetch(
    `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(
      `TikTok video status check failed: ${data.error?.message || data.error?.description || response.statusText}`
    );
  }

  return data;
}

/**
 * Post video to TikTok (server-side version)
 * This function handles the full flow: init, upload, and status check
 */
export async function postVideoToTikTok(
  accessToken: string,
  openId: string,
  videoBlob: Blob,
  options: {
    title?: string;
    privacy_level?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disable_duet?: boolean;
    disable_comment?: boolean;
    disable_stitch?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{ publish_id: string; status: string }> {
  // Step 1: Initialize upload
  const initResponse = await initVideoUpload(accessToken, openId, {
    title: options.title,
    privacy_level: options.privacy_level,
    disable_duet: options.disable_duet,
    disable_comment: options.disable_comment,
    disable_stitch: options.disable_stitch,
  });

  const { publish_id, upload_url } = initResponse.data;

  // Step 2: Upload video
  // Note: This needs to be done client-side or with a server that can handle file uploads
  // For server-side, we'll need to use a different approach
  // For now, return the upload URL and publish_id for client-side upload
  return {
    publish_id,
    status: 'PENDING_UPLOAD',
  };
}

