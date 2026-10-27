import { notFound } from 'next/navigation';

import { PostForm } from '@/components/admin/PostForm';
import { requireAdmin } from '@/lib/auth-guard';
import { getPostForAdminBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

interface AdminEditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AdminEditPostPage({
  params,
}: AdminEditPostPageProps) {
  await requireAdmin();

  const { slug } = await params;
  const post = await getPostForAdminBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PostForm initialPost={post} isEditing />;
}
