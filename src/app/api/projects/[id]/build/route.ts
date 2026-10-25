import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Generate a realistic-looking mock build log. ~90% success path produces
 * a green success log; the failure path produces a red error log.
 */
function buildLog(success: boolean, buildCommand: string, outputDir: string): string {
  const ts = () => new Date().toISOString().slice(11, 19);
  const lines: string[] = [];
  lines.push(`$ ${buildCommand}`);
  lines.push(`[${ts()}] Resolving workspace...`);
  lines.push(`[${ts()}] Installing dependencies (cached)`);
  lines.push(`[${ts()}]   ✓ bun.lock verified`);
  lines.push(`[${ts()}] Compiling TypeScript sources...`);
  lines.push(`[${ts()}]   ✓ src/app/page.tsx`);
  lines.push(`[${ts()}]   ✓ src/components/layout/navbar.tsx`);
  lines.push(`[${ts()}]   ✓ src/lib/auth.ts`);
  lines.push(`[${ts()}] Bundling client assets...`);
  lines.push(`[${ts()}]   ✓ 142 modules transformed`);
  lines.push(`[${ts()}] Optimizing production output...`);

  if (success) {
    lines.push(`[${ts()}]   ✓ Output written to ${outputDir}/`);
    lines.push(`[${ts()}]   ✓ Static pages prerendered: 8/8`);
    lines.push(`[${ts()}]   ✓ First Load JS shared: 87.3 kB`);
    lines.push(`[${ts()}]   ✓ First Load JS per route: ~135 kB`);
    lines.push(`[${ts()}] Build completed in 2.84s`);
    lines.push(`✓ Build succeeded`);
  } else {
    lines.push(`[${ts()}]   ✗ Error: Type 'string' is not assignable to type 'number'.`);
    lines.push(`[${ts()}]     at src/app/projects/page.tsx:42:7`);
    lines.push(`[${ts()}]     at src/components/project-card.tsx:18:3`);
    lines.push(`[${ts()}]   ✗ Found 1 error in 2 files.`);
    lines.push(`[${ts()}] Build failed with exit code 1`);
    lines.push(`✗ Build failed`);
  }
  return lines.join("\n");
}

/**
 * POST /api/projects/[id]/build
 *
 * Simulates a build:
 * 1. Create a BuildRun with status "running".
 * 2. Set project status to "building".
 * 3. Wait 3s (simulating real build time).
 * 4. 90% chance: status "success" → project "ready"; otherwise "failed" → project "error".
 * 5. Update BuildRun with the mock log + duration.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    select: { userId: true, buildCommand: true, outputDir: true, name: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark project as building + create a running build run.
  await db.project.update({
    where: { id },
    data: { status: "building" },
  });
  const buildRun = await db.buildRun.create({
    data: {
      projectId: id,
      status: "running",
      log: "Build started...\n",
    },
  });

  const start = Date.now();
  // Simulate build latency (3s). This is a sandbox-friendly approximation —
  // a real deployment would spawn a child process here.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 90% success rate.
  const success = Math.random() < 0.9;
  const duration = Date.now() - start;
  const log = buildLog(success, project.buildCommand, project.outputDir);

  const updated = await db.buildRun.update({
    where: { id: buildRun.id },
    data: { status: success ? "success" : "failed", log, duration },
  });

  await db.project.update({
    where: { id },
    data: {
      status: success ? "ready" : "error",
      lastBuildAt: new Date(),
    },
  });

  return NextResponse.json({ buildRun: updated });
}
