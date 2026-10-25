import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Helper: load a project by id, returning only the userId for ownership
 * checks. Returns null if not found.
 */
async function loadOwner(id: string) {
  return db.project.findUnique({
    where: { id },
    select: { userId: true },
  });
}

/**
 * GET /api/projects/[id]
 * Returns the project + its 10 most-recent builds + integration connected
 * booleans (github / vercel / neno).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      builds: { orderBy: { createdAt: "desc" }, take: 10 },
      githubIntegration: { select: { id: true, repoFullName: true, defaultBranch: true } },
      vercelIntegration: { select: { id: true, vercelProjectName: true } },
      nenoIntegration: { select: { id: true, environment: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { githubIntegration, vercelIntegration, nenoIntegration, ...rest } =
    project;
  return NextResponse.json({
    project: {
      ...rest,
      githubConnected: !!githubIntegration,
      githubRepo: githubIntegration?.repoFullName || null,
      githubBranch: githubIntegration?.defaultBranch || null,
      vercelConnected: !!vercelIntegration,
      vercelProjectName: vercelIntegration?.vercelProjectName || null,
      nenoConnected: !!nenoIntegration,
      nenoEnvironment: nenoIntegration?.environment || null,
    },
  });
}

/**
 * PATCH /api/projects/[id]
 * Update name, description, framework, buildCommand, outputDir, localPath,
 * envVars, status, repoUrl, repoFullName, defaultBranch, lastDeployUrl,
 * lastBuildAt.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const { id } = await params;

  const existing = await loadOwner(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.framework === "string" && body.framework) data.framework = body.framework;
  if (typeof body.buildCommand === "string") data.buildCommand = body.buildCommand;
  if (typeof body.outputDir === "string") data.outputDir = body.outputDir;
  if (typeof body.localPath === "string") data.localPath = body.localPath || null;
  if (typeof body.envVars === "string") data.envVars = body.envVars;
  if (typeof body.status === "string" && body.status) data.status = body.status;
  if (typeof body.repoUrl === "string") data.repoUrl = body.repoUrl || null;
  if (typeof body.repoFullName === "string") data.repoFullName = body.repoFullName || null;
  if (typeof body.defaultBranch === "string") data.defaultBranch = body.defaultBranch;
  if (typeof body.lastDeployUrl === "string") data.lastDeployUrl = body.lastDeployUrl || null;
  if (body.lastBuildAt !== undefined) {
    data.lastBuildAt = body.lastBuildAt ? new Date(body.lastBuildAt) : null;
  }

  const updated = await db.project.update({
    where: { id },
    data,
  });
  return NextResponse.json({ project: updated });
}

/**
 * DELETE /api/projects/[id]
 * Cascades to BuildRun, GitHubIntegration, VercelIntegration, NenoIntegration
 * via the schema's onDelete: Cascade.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const { id } = await params;

  const existing = await loadOwner(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
