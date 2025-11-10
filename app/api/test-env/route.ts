import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AI_PROVIDER: process.env.AI_PROVIDER || 'not set',
    hasKIMI_API_KEY: !!process.env.KIMI_API_KEY,
    hasOPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  });
}
