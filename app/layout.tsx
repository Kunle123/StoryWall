import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata = {
  title: 'Timeline - Interactive Timeline Platform',
  description: 'A powerful timeline component for visualizing any historical data',
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


