// Augment next-auth types to include role + id on the session user
import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    emailVerified?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      email: string;
      name?: string | null;
      role?: string;
      emailVerified?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    emailVerified?: string | null;
  }
}
