import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { resumeConfig } from '@/config/Resume';
import Link from 'next/link';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  ...getMetadata('/resume'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ResumePage() {
  return (
    <Container className="py-16">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Resume & CV
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Systems software resume and AI/ML-focused CV.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href={resumeConfig.resumeUrl} target="_blank">
                Open Resume
              </Link>
            </Button>
            <Button asChild>
              <Link href={resumeConfig.cvUrl} target="_blank">
                Open AI/ML CV
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
        <div className="mx-auto max-w-2xl">
          <iframe
            src={resumeConfig.resumeUrl}
            className="min-h-screen w-full"
          ></iframe>
        </div>
      </div>
    </Container>
  );
}
