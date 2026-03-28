'use client';

import { SignIn } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { StoryWallIcon } from '@/components/StoryWallIcon';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { absoluteUrl } from '@/lib/utils/siteUrl';
import { getSafePostAuthPathFromSearchParams } from '@/lib/utils/safePostAuthRedirect';
import { storyWallClerkAppearance } from '@/lib/clerkAppearance';

function SignInContent() {
  const { theme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  /** Same-origin path from ?redirect= or Clerk ?redirect_url=, then absolute URL for Clerk allowlists */
  const afterAuthPath = getSafePostAuthPathFromSearchParams(searchParams);
  const afterAuthUrl = absoluteUrl(afterAuthPath);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkKeyLooksValid = !!pk && /^pk_(test|live)_[A-Za-z0-9_\-]{20,}$/.test(pk);
  if (!clerkKeyLooksValid) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold mb-3">Authentication not configured</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a Clerk account and set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign in.</p>
        </div>
      </div>
    );
  }

  const isDark = mounted && resolvedTheme === 'dark';
  const clerkIsDark = resolvedTheme === 'dark';
  const clerkAppearance = storyWallClerkAppearance(clerkIsDark);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-card' : 'bg-white'} flex items-center justify-center border ${isDark ? 'border-border' : ''}`}>
              <StoryWallIcon size={48} />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Welcome to StoryWall</h1>
          <p className="text-sm text-muted-foreground">
            Share your weird, funny, and strange moments with the world
          </p>
        </div>

        <SignIn 
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          forceRedirectUrl={afterAuthUrl}
          appearance={clerkAppearance}
        />

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Privacy Policy
          </a>
        </p>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <p className="text-center text-muted-foreground text-sm">Loading…</p>
          </Card>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

