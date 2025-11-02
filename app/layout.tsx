import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'Timeline - Interactive Timeline Platform',
  description: 'A powerful timeline component for visualizing any historical data',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}


