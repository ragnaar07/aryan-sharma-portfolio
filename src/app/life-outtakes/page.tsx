import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';

import Container from '@/components/common/Container';
import { LifeOuttakeGrid } from '@/components/life-outtakes/LifeOuttakeGrid';
import { Button } from '@/components/ui/button';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { getLifeOuttakes } from '@/lib/life-outtakes';

export const metadata: Metadata = getMetadata('/life-outtakes');

export default async function LifeOuttakesPage() {
  const outtakes = (await getLifeOuttakes()).filter(
    (outtake) => outtake.isPublished,
  );

  return (
    <Container className="min-h-screen py-16">
      <div className="mb-8">
        <p className="text-secondary text-sm">Side quests</p>
        <h1 className="text-3xl font-bold tracking-tight">Life Outtakes</h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
          A few frames from the moments that happen away from the screen.
        </p>
      </div>

      {outtakes.length > 0 ? (
        <LifeOuttakeGrid outtakes={outtakes} />
      ) : (
        <p className="text-muted-foreground text-sm">
          A few moments will find their way here soon.
        </p>
      )}

      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Back to portfolio</Link>
      </Button>
    </Container>
  );
}
