import { AdminHeader } from '@/components/admin/AdminHeader';
import Container from '@/components/common/Container';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Strict server-side security boundary: throws or redirects to /admin/login if not authorized
  const session = await requireAdmin();

  return (
    <div className="bg-background min-h-screen">
      <AdminHeader session={session} />
      <Container className="py-8">{children}</Container>
    </div>
  );
}
