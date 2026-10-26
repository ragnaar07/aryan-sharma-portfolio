import { auth, signIn } from '@/auth';
import Container from '@/components/common/Container';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import Github from '@/components/svgs/Github';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { redirect } from 'next/navigation';

interface AdminLoginPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const session = await auth();
  const adminId = process.env.ADMIN_GITHUB_ID?.trim();
  if (adminId && session?.user?.id === adminId) {
    redirect('/admin');
  }

  const params = await searchParams;
  const error = params?.error;
  const callbackUrl = params?.callbackUrl || '/admin';

  return (
    <Container className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-16">
      <Card className="border-border bg-card w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
            <Github className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Admin Sign In
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sign in with your authorized GitHub account to manage portfolio
            content.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <ShieldAlert className="size-4" />
              <AlertTitle>
                {error === 'AccessDenied'
                  ? 'Access Denied'
                  : error === 'Configuration'
                    ? 'Configuration Error'
                    : 'Sign In Failed'}
              </AlertTitle>
              <AlertDescription>
                {error === 'AccessDenied'
                  ? 'Your GitHub account is not authorized. Only the portfolio administrator can access this area.'
                  : error === 'Configuration'
                    ? 'Server authentication is not configured properly. Check server environment variables.'
                    : 'An unexpected authentication error occurred. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <form
            action={async () => {
              'use server';
              await signIn('github', { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" size="lg" className="w-full font-medium">
              <Github className="mr-2 size-5" />
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>

        <CardFooter className="border-border flex justify-center border-t pt-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to portfolio
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
}
