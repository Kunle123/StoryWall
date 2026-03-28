'use client';

import { SignUp } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { StoryWallIcon } from '@/components/StoryWallIcon';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { storyWallClerkAppearance } from '@/lib/clerkAppearance';

export default function SignUpPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
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
          <p className="text-gray-600 dark:text-gray-400">Create a Clerk account and set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign up.</p>
        </div>
      </div>
    );
  }

  const isDark = mounted && resolvedTheme === 'dark';
  const clerkIsDark = resolvedTheme === 'dark';
  const baseClerk = storyWallClerkAppearance(clerkIsDark);
  const clerkAppearance = {
    ...baseClerk,
    elements: {
      ...baseClerk.elements,
      footer: 'hidden',
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-card' : 'bg-white'} flex items-center justify-center border ${isDark ? 'border-border' : ''}`}>
              <StoryWallIcon size={48} />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Welcome to StoryWall!</h1>
          <p className="text-sm font-semibold text-primary mb-2">
            Your 30 free AI image credits are ready.
          </p>
          <p className="text-sm text-muted-foreground">
            Create stunning visual timelines with AI-generated images
          </p>
        </div>

        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/legal/accept-terms"
          appearance={clerkAppearance}
        />

        <p className="text-xs text-center text-muted-foreground">
          By creating an account, you will be asked to accept our{' '}
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Privacy Policy
          </a>
          {' '}before continuing.
        </p>
      </Card>
    </div>
  );
}


