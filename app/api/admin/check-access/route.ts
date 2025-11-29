import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/utils/admin';

/**
 * GET /api/admin/check-access - Check if a user has admin access
 * 
 * Query params:
 * - email: User's email address
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required', isAdmin: false },
        { status: 400 }
      );
    }

    const admin = isAdminEmail(email);

    return NextResponse.json({
      isAdmin: admin,
      email: email,
    });
  } catch (error: any) {
    console.error('[Admin Check Access] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin access', isAdmin: false },
      { status: 500 }
    );
  }
}

