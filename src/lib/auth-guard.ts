import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import 'server-only';

export interface RequireAdminOptions {
  /**
   * If true, redirects unauthenticated or unauthorized users to /admin/login.
   * If false, throws an Error (ideal for Server Actions).
   * Defaults to true.
   */
  redirectOnFail?: boolean;
}

/**
 * Server-only security boundary for admin pages and Server Actions.
 * Verifies that the current session belongs to the designated admin (matching ADMIN_GITHUB_ID).
 * Throws or redirects when unauthorized.
 */
export async function requireAdmin(
  options: RequireAdminOptions = { redirectOnFail: true },
): Promise<Session> {
  const session = await auth();
  const adminId = process.env.ADMIN_GITHUB_ID?.trim();

  const isAuthorized =
    Boolean(adminId) &&
    Boolean(session?.user?.id) &&
    session?.user?.id === adminId;

  if (!isAuthorized) {
    if (options.redirectOnFail) {
      redirect('/admin/login');
    }
    throw new Error('Unauthorized: Admin access required');
  }

  return session as Session;
}
