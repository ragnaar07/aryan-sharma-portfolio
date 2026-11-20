import { LifeOuttakesManager } from '@/components/admin/LifeOuttakesManager';
import { requireAdmin } from '@/lib/auth-guard';
import { getLifeOuttakes } from '@/lib/life-outtakes';

export const dynamic = 'force-dynamic';

export default async function AdminLifeOuttakesPage() {
  await requireAdmin();

  const outtakes = await getLifeOuttakes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Life Outtakes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Curate the personal moments visitors see between your blog and contact
          links.
        </p>
      </div>
      <LifeOuttakesManager outtakes={outtakes} />
    </div>
  );
}
