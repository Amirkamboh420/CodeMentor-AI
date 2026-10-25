import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "./db";
import { authOptions } from "./next-auth-options";
import type { Project } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Authenticate the request and verify the caller owns (or admins) the
 * project. Returns either a typed "ok" payload with the project record
 * + the authenticated user id, or a NextResponse to short-circuit with.
 *
 * Usage:
 *   const access = await requireProjectOwnership(projectId);
 *   if (!access.ok) return access.response;
 *   // access.project, access.userId
 */
export async function requireProjectOwnership(
  projectId: string
): Promise<
  | { ok: true; project: Project; userId: string; role: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  const userId = session.user.id as string;
  const role = (session.user.role as string) ?? "USER";

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      framework: true,
      status: true,
      localPath: true,
      repoUrl: true,
      repoFullName: true,
      defaultBranch: true,
      lastBuildAt: true,
      lastDeployUrl: true,
      buildCommand: true,
      outputDir: true,
      envVars: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!project) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      ),
    };
  }
  if (project.userId !== userId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, project: project as Project, userId, role };
}

/** Generate a pseudo-random mock Git commit SHA (40 hex chars). */
export function mockCommitSha(): string {
  const chars = "0123456789abcdef";
  let sha = "";
  for (let i = 0; i < 40; i++) {
    sha += chars[Math.floor(Math.random() * 16)];
  }
  return sha;
}

/** Generate a Vercel-style deployment id (e.g. dpl_8Kq2x...). */
export function mockDeploymentId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "dpl_";
  for (let i = 0; i < 17; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/** Slugify a project name into a Vercel-style subdomain. */
export function mockVercelUrl(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "my-project";
  return `https://${slug}.vercel.app`;
}
