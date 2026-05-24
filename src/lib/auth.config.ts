import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-compatible config (no Prisma, no Node.js modules)
export const authConfig = {
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
      const isOnFavoritos = nextUrl.pathname.startsWith("/favoritos");
      if (isOnFavoritos) {
        if (isLoggedIn) return true;
        return false; // redirect to signIn
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
