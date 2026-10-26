import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import 'server-only';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async signIn({ profile, user }) {
      const adminId = process.env.ADMIN_GITHUB_ID?.trim();
      if (!adminId) {
        console.error(
          '[auth] ADMIN_GITHUB_ID is not configured in environment variables',
        );
        return false;
      }

      const githubId =
        profile?.id != null
          ? String(profile.id).trim()
          : user?.id != null
            ? String(user.id).trim()
            : null;

      if (!githubId || githubId !== adminId) {
        console.warn(
          `[auth] Access denied. Sign-in attempted with GitHub ID: ${githubId || 'unknown'}. Expected: ${adminId}`,
        );
        return false;
      }

      return true;
    },
    async jwt({ token, profile, user }) {
      if (profile?.id != null) {
        token.githubId = String(profile.id);
      } else if (user?.id) {
        token.githubId = String(user.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.githubId as string) || (token.sub as string);
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
