import { signOut } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import type { Session } from 'next-auth';
import { Link } from 'next-view-transitions';

interface AdminHeaderProps {
  session: Session;
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const userName = session.user?.name || 'Administrator';
  const userImage = session.user?.image || undefined;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="border-border bg-card/50 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight">Admin Portal</span>
              <Badge variant="outline" className="text-xs font-normal">
                Single Admin
              </Badge>
            </div>
            <span className="text-muted-foreground text-xs">
              Logged in as {userName}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs"
            >
              <span>View Site</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>

          <Avatar className="border-border size-8 border">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>

          {/* Sign Out Control */}
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center gap-1.5 text-xs transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
