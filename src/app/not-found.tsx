import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'next-view-transitions';

import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <Container className="flex min-h-[65vh] items-center justify-center py-16">
      <Card className="border-border bg-card w-full max-w-xl text-center shadow-sm">
        <CardHeader className="items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
            <SearchX className="size-7" />
          </div>
          <p className="text-primary text-sm font-semibold tracking-widest uppercase">
            Error 404
          </p>
          <CardTitle className="text-3xl">Page not found</CardTitle>
          <CardDescription className="max-w-md text-base">
            This page may have moved or the link may be incorrect. Head back to
            the portfolio to continue exploring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
