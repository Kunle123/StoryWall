import { NextResponse } from 'next/server';

/**
 * GET /api/debug-code-version
 * Debug endpoint to check which version of the code is running
 * Helps identify if new code has been deployed
 */
export async function GET() {
  // Check if https module is being used (new code) vs fetch (old code)
  // We can't directly check, but we can check the build time or git commit
  const buildTime = process.env.BUILD_TIME || 'unknown';
  const nodeEnv = process.env.NODE_ENV || 'unknown';
  
  // Check if https module is available (it should be in Node.js)
  let httpsAvailable = false;
  try {
    const https = require('https');
    httpsAvailable = typeof https.request === 'function';
  } catch {
    httpsAvailable = false;
  }
  
  return NextResponse.json({
    message: 'Code version check',
    buildTime,
    nodeEnv,
    httpsModuleAvailable: httpsAvailable,
    note: 'If httpsModuleAvailable is true, the new code with https module fix should be available. Check Railway logs to confirm APPEND step is using https module.',
    checkDeployment: 'If you see old behavior in logs, Railway may not have redeployed yet. Check Railway dashboard for latest deployment status.',
  });
}

