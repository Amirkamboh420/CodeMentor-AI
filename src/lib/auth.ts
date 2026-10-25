import bcrypt from "bcryptjs";
import { db } from "./db";

export const SALT_ROUNDS = 10;

/** Hash a plaintext password using bcrypt. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a plaintext password against a bcrypt hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Generate a random token (URL-safe). */
export function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

/** Returns true if `role` meets or exceeds the required `minRole`. */
export function hasRole(
  role: string | undefined | null,
  minRole: Role
): boolean {
  if (!role) return false;
  const r = role as Role;
  if (!(r in ROLE_HIERARCHY)) return false;
  return ROLE_HIERARCHY[r] >= ROLE_HIERARCHY[minRole];
}

/** Returns true if the user is at least an admin (ADMIN or SUPER_ADMIN). */
export function isAdmin(role: string | undefined | null): boolean {
  return hasRole(role, "ADMIN");
}

/** Returns true if the user is a super admin. */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN";
}

// ---------------------------------------------------------------------------
// Seed: create a default super admin if none exists
// ---------------------------------------------------------------------------

const DEFAULT_ADMIN_EMAIL = "admin@codementor.ai";
const DEFAULT_ADMIN_PASSWORD = "admin123";

/**
 * Ensures a super-admin account exists. Called at server startup.
 * If no users exist at all, creates the default super admin.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "production") {
      const existingAdmin = await db.user.findUnique({
        where: { email: DEFAULT_ADMIN_EMAIL },
      });
      const passwordMatches = existingAdmin
        ? await verifyPassword(DEFAULT_ADMIN_PASSWORD, existingAdmin.password)
        : false;

      if (
        !existingAdmin ||
        existingAdmin.role !== "SUPER_ADMIN" ||
        !passwordMatches
      ) {
        const hash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
        await db.user.upsert({
          where: { email: DEFAULT_ADMIN_EMAIL },
          update: {
            name: "Super Admin",
            password: hash,
            role: "SUPER_ADMIN",
            emailVerified: new Date(),
          },
          create: {
            email: DEFAULT_ADMIN_EMAIL,
            name: "Super Admin",
            password: hash,
            role: "SUPER_ADMIN",
            emailVerified: new Date(),
          },
        });
      }
      return;
    }

    const userCount = await db.user.count();
    if (userCount === 0) {
      const hash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await db.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          name: "Super Admin",
          password: hash,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
        },
      });
      console.log(
        `[auth] Created default super admin: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`
      );
    }
  } catch (err) {
    console.error("[auth] Failed to ensure default admin:", err);
  }
}
