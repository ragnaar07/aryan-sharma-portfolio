import { Link } from 'next-view-transitions';

import { LifeOuttakeGrid } from '@/components/life-outtakes/LifeOuttakeGrid';
import { getLifeOuttakes } from '@/lib/life-outtakes';

import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { Button } from '../ui/button';

export default async function LifeOuttakes() {
  const outtakes = (await getLifeOuttakes())
    .filter((outtake) => outtake.isPublished)
    .slice(0, 3);

  return (
    <Container
      id="life-outtakes"
      className="mt-20 scroll-mt-24"
      aria-labelledby="life-outtakes-heading"
    >
      <SectionHeading
        subHeading="Side quests"
        heading="Life Outtakes"
        headingId="life-outtakes-heading"
      />
      <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
        A few frames from the moments that happen away from the screen.
      </p>

      {outtakes.length > 0 ? (
        <div className="mt-8">
          <LifeOuttakeGrid outtakes={outtakes} />
        </div>
      ) : (
        <p className="text-muted-foreground mt-8 text-sm">
          A few moments will find their way here soon.
        </p>
      )}
      <Button asChild variant="outline" className="mt-6">
        <Link href="/life-outtakes">Explore all moments</Link>
      </Button>
    </Container>
  );
}
