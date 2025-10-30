import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'Timeline - Interactive Timeline Platform',
  description: 'A powerful timeline component for visualizing any historical data',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkKeyLooksValid = !!pk && /^pk_(test|live)_[A-Za-z0-9_\-]{20,}$/.test(pk);
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {clerkKeyLooksValid ? (
          <ClerkProvider>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}


