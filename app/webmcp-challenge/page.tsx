import type { Metadata } from 'next';
import { ChallengeExperience } from '@/components/webmcp-challenge/ChallengeExperience';

export const metadata: Metadata = {
  title: 'Aimily Context Review | OpenAI WebMCP Challenge',
  description: 'From agent signal to governed collection truth: Context Graph diff, evidence, exact-hash human approval, verified receipt and undo.',
  applicationName: 'Aimily Context Review',
  category: 'technology',
  alternates: {
    canonical: 'https://aimily-webmcp-challenge.vercel.app/webmcp-challenge',
  },
  openGraph: {
    type: 'website',
    url: 'https://aimily-webmcp-challenge.vercel.app/webmcp-challenge',
    siteName: 'Aimily',
    title: 'Aimily Context Review | OpenAI WebMCP Challenge',
    description: 'A personal agent brings the signal. Aimily turns it into governed collection truth with human authority, receipts and recovery.',
    images: [{
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Aimily Context Review: from agent signal to governed collection truth',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aimily Context Review | OpenAI WebMCP Challenge',
    description: 'From agent signal to governed collection truth.',
    images: ['/opengraph-image'],
  },
  robots: { index: false, follow: false },
};

export default function WebMcpChallengePage() {
  return <ChallengeExperience />;
}
