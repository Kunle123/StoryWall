import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'StoryWall',
  description: 'Collaborative timeline platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {hasClerk ? (
          <ClerkProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <Footer />
          </ClerkProvider>
        ) : (
          <>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}


