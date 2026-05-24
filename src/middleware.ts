import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use edge-compatible config (no Prisma) for middleware
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/favoritos/:path*"],
};
