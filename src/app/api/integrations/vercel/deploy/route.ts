import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireProjectOwnership,
  mockDeploymentId,
  mockVercelUrl,
} from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * POST /api/integrations/vercel/deploy
 * Body: { projectId }
 *
 * Simulates a Vercel deployment. In production this would POST to the Vercel
 * API (`/v13/deployments`) using the stored access token, then poll the
 * deployment status until ready. Here we return a mock deployment id + a
 * vercel.app-style URL and mark the project as live.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId } = body as { projectId?: string };

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required field: projectId" },
      { status: 400 }
    );
  }

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const integration = await db.vercelIntegration.findUnique({
    where: { projectId },
    select: { vercelProjectName: true, teamId: true },
  });
  if (!integration) {
    return NextResponse.json(
      { error: "Vercel is not connected to this project" },
      { status: 400 }
    );
  }

  const deploymentId = mockDeploymentId();
  const url = mockVercelUrl(
    integration.vercelProjectName || access.project.name
  );

  await db.project.update({
    where: { id: projectId },
    data: {
      status: "live",
      lastDeployUrl: url,
      lastBuildAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    deployed: true,
    deploymentId,
    url,
    status: "live",
    projectName: integration.vercelProjectName,
    teamId: integration.teamId,
    deployedAt: new Date().toISOString(),
  });
}
