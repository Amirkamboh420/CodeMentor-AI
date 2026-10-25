import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/projects
 * List the current user's projects, ordered by most-recently-updated.
 * Includes a `_count` of builds so the UI can render a build count badge.
 * Admins see all projects.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  const projects = await db.project.findMany({
    where: admin ? {} : { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { builds: true } },
      githubIntegration: { select: { id: true } },
      vercelIntegration: { select: { id: true } },
      nenoIntegration: { select: { id: true } },
    },
  });

  // Flatten the integration relations to connected booleans for the UI.
  const withFlags = projects.map((p) => ({
    ...p,
    githubConnected: !!p.githubIntegration,
    vercelConnected: !!p.vercelIntegration,
    nenoConnected: !!p.nenoIntegration,
    githubIntegration: undefined,
    vercelIntegration: undefined,
    nenoIntegration: undefined,
  }));

  return NextResponse.json({ projects: withFlags });
}

/**
 * POST /api/projects
 * Create a new project owned by the authenticated user.
 *
 * Body: { name, description?, framework?, buildCommand?, outputDir? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const framework =
    typeof body.framework === "string" && body.framework
      ? body.framework
      : "nextjs";

  // Sensible default build command + output dir per framework.
  const { buildCommand, outputDir } = defaultsForFramework(framework);
  const finalBuildCommand =
    typeof body.buildCommand === "string" && body.buildCommand
      ? body.buildCommand
      : buildCommand;
  const finalOutputDir =
    typeof body.outputDir === "string" && body.outputDir
      ? body.outputDir
      : outputDir;

  const project = await db.project.create({
    data: {
      name,
      description:
        typeof body.description === "string" ? body.description : "",
      framework,
      buildCommand: finalBuildCommand,
      outputDir: finalOutputDir,
      status: "development",
      userId,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}

/**
 * Returns the default build command + output dir for a given framework.
 * Used both at creation time and by the client to auto-fill the form.
 */
export function defaultsForFramework(framework: string): {
  buildCommand: string;
  outputDir: string;
} {
  switch (framework) {
    case "nextjs":
      return { buildCommand: "bun run build", outputDir: ".next" };
    case "react":
      return { buildCommand: "vite build", outputDir: "dist" };
    case "node":
      return { buildCommand: "tsc -p tsconfig.json", outputDir: "dist" };
    case "static":
      return { buildCommand: "echo 'No build step'", outputDir: "public" };
    default:
      return { buildCommand: "bun run build", outputDir: ".next" };
  }
}
