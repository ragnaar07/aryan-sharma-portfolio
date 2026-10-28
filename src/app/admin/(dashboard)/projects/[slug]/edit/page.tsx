import { ProjectForm } from '@/components/admin/ProjectForm';
import { requireAdmin } from '@/lib/auth-guard';
import { getProjectForAdminBySlug } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function AdminEditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const project = await getProjectForAdminBySlug(slug);

  return <ProjectForm initialProject={project} isEditing />;
}
