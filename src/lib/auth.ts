import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Coolify/sslip.io: NEXTAUTH_URL alone does not enable trustHost (only AUTH_URL does).
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }, // JWT for edge-compatible middleware
  callbacks: {
    ...authConfig.callbacks,
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
