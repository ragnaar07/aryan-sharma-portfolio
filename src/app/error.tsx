'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { useEffect } from 'react';

import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[app] Unhandled route error:', error);
  }, [error]);

  return (
    <Container className="flex min-h-[65vh] items-center justify-center py-16">
      <Card className="border-border bg-card w-full max-w-xl text-center shadow-sm">
        <CardHeader className="items-center gap-3">
          <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
            <AlertTriangle className="size-7" />
          </div>
          <CardTitle className="text-3xl">Something went wrong</CardTitle>
          <CardDescription className="max-w-md text-base">
            An unexpected error interrupted this page. You can try again or
            return to the portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
