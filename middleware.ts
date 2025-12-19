import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/legal',
  '/api',
];

// Routes that don't require terms acceptance check
const exemptRoutes = [
  '/legal/accept-terms',
  '/sign-in',
  '/sign-up',
  '/api',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    // Redirect to sign-in with return URL
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if route is exempt from terms check
  if (exemptRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user has accepted terms
  try {
    const { prisma } = await import('@/lib/db/prisma');
    const { getOrCreateUser } = await import('@/lib/db/users');
    
    const user = await getOrCreateUser(userId);
    const userWithTerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { termsAcceptedAt: true },
    });

    // If terms not accepted, redirect to acceptance page
    if (!userWithTerms?.termsAcceptedAt) {
      const acceptTermsUrl = new URL('/legal/accept-terms', request.url);
      acceptTermsUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(acceptTermsUrl);
    }
  } catch (error) {
    // If there's an error checking terms, allow through (fail open)
    // This prevents blocking users if there's a database issue
    console.error('[Middleware] Error checking terms acceptance:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
