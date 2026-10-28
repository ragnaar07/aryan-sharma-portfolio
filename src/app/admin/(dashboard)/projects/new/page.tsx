import { ProjectForm } from '@/components/admin/ProjectForm';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminNewProjectPage() {
  await requireAdmin();

  return <ProjectForm />;
}
