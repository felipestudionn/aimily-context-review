import type { Metadata } from 'next';
import '@/styles/globals.css';
import { geist } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL('https://aimily-webmcp-challenge.vercel.app'),
};

export default function ChallengeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen bg-shade text-carbon antialiased">{children}</body>
    </html>
  );
}
