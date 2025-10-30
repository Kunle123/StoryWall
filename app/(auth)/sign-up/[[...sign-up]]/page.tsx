'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <SignUp routing="hash" />
    </div>
  );
}


