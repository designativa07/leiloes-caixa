import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-compatible config (no Prisma, no Node.js modules)
export const authConfig = {
  trustHost: true, // required behind Coolify/Traefik reverse proxy
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith("/admin")) {
        // Fail-closed: sem ADMIN_EMAILS configurado ninguem acessa /admin.
        const admins = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const email = auth?.user?.email?.toLowerCase();
        return !!email && admins.includes(email);
      }
      const isOnFavoritos = nextUrl.pathname.startsWith("/favoritos");
      if (isOnFavoritos) {
        if (isLoggedIn) return true;
        return false; // redirect to signIn
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
