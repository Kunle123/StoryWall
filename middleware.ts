import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes - routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/auth(.*)', // Auth page (uses Clerk SignIn with sign-up toggle)
  '/',
  '/discover',
  '/explore',
  '/timeline(.*)',
  '/story(.*)',
  '/api(.*)', // All API routes are public (they handle auth internally)
]);

export default clerkMiddleware(async (auth, request) => {
  // Redirect storywall.com to www.storywall.com
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Only redirect in production (not localhost)
  if (process.env.NODE_ENV === 'production' && hostname === 'storywall.com') {
    url.hostname = 'www.storywall.com';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // Protect routes that are not public
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

