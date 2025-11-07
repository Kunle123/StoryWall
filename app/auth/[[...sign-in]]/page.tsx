"use client";

import { SignIn } from '@clerk/nextjs';

export default function AuthPage() {
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
    <div className="min-h-screen grid place-items-center p-6">
      <SignIn 
        routing="path"
        path="/auth"
        signUpUrl="/auth"
        fallbackRedirectUrl="/"
        appearance={{
          elements: {
            socialButtonsBlockButton: "flex items-center justify-center",
          }
        }}
      />
    </div>
  );
}

