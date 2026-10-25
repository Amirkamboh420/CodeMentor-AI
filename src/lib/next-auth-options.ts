import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { verifyPassword } from "./auth";

export const authOptions: NextAuthOptions = {
  // JWT-based sessions (no DB session storage needed)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified?.toISOString() || null,
        } as {
          id: string;
          email: string;
          name: string | null;
          role: string;
          emailVerified: string | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist role + emailVerified in the JWT
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.emailVerified =
          (user as { emailVerified: string | null }).emailVerified || null;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role + id + emailVerified on the session user
      if (session.user) {
        (session.user as {
          id?: string;
          role?: string;
          emailVerified?: string | null;
        }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as {
          emailVerified?: string | null;
        }).emailVerified = (token.emailVerified as string | null) || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "codementor-dev-secret-change-in-prod",
};
