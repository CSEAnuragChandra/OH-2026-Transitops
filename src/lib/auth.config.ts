import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user ??= {} as typeof session.user;
      session.user.id = token.id as string;
      (session.user as { role: Role }).role = token.role as Role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
