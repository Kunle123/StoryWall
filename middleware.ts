import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/legal',
];

// Routes that don't require terms acceptance check
const exemptRoutes = [
  '/legal/accept-terms',
  '/sign-in',
  '/sign-up',
  '/api',
];

const isPublicRoute = createRouteMatcher(publicRoutes);
const isExemptRoute = createRouteMatcher(exemptRoutes);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(request) || pathname.startsWith('/api')) {
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

  // Terms acceptance check moved out of Edge middleware to avoid Prisma on Edge.
  // Perform terms checks in a server route/layout instead of middleware.

  return NextResponse.next();
});

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
