'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!hasClerk) {
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
    <div className="min-h-screen grid place-items-center p-6">
      <SignIn routing="hash" />
    </div>
  );
}


