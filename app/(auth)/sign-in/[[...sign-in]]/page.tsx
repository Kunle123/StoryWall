'use client';

import { SignIn } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { StoryWallIcon } from '@/components/StoryWallIcon';
import Link from 'next/link';

export default function SignInPage() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkKeyLooksValid = !!pk && /^pk_(test|live)_[A-Za-z0-9_\-]{20,}$/.test(pk);
  if (!clerkKeyLooksValid) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold mb-3">Authentication not configured</h1>
          <p className="text-gray-600">Create a Clerk account and set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign in.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
              <StoryWallIcon size={48} />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Welcome to StoryWall</h1>
          <p className="text-sm text-muted-foreground">
            Share your weird, funny, and strange moments with the world
          </p>
        </div>

        <SignIn 
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none bg-transparent',
            },
          }}
        />

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Privacy Policy
          </a>
        </p>
      </Card>
    </div>
  );
}


