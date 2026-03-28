import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getSiteOrigin } from '@/lib/utils/siteUrl';

const site = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: site ? new URL(site) : undefined,
  title: 'StoryWall — Visual timelines with AI',
  description:
    'Create and share visual timelines — AI images or your own. Free to start with enough credits for several real stories. Explore or build explainers, histories, and stories worth sharing.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <ClerkProvider
      // Suppress development key warnings in development
      {...(process.env.NODE_ENV === 'development' ? {} : {})}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          {gaMeasurementId && (
            <GoogleAnalytics gaId={gaMeasurementId} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}


