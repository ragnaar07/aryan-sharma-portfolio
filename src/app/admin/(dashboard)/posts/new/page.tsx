import { PostForm } from '@/components/admin/PostForm';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminNewPostPage() {
  await requireAdmin();

  return <PostForm />;
}
