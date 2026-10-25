import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * POST /api/integrations/vercel/connect
 * Body: { projectId, accessToken, teamId?, vercelProjectId?, vercelProjectName? }
 *
 * Accepts a Vercel access token (create one at
 * https://vercel.com/account/tokens). In production you would usually use
 * the Vercel OAuth flow; the upsert shape here is identical either way.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    projectId,
    accessToken,
    teamId,
    vercelProjectId,
    vercelProjectName,
  } = body as {
    projectId?: string;
    accessToken?: string;
    teamId?: string;
    vercelProjectId?: string;
    vercelProjectName?: string;
  };

  if (!projectId || !accessToken) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, accessToken" },
      { status: 400 }
    );
  }

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const projectName = vercelProjectName?.trim() || access.project.name;

  await db.vercelIntegration.upsert({
    where: { projectId },
    create: {
      projectId,
      accessToken,
      teamId: teamId?.trim() || null,
      vercelProjectId: vercelProjectId?.trim() || null,
      vercelProjectName: projectName,
    },
    update: {
      accessToken,
      teamId: teamId?.trim() || null,
      vercelProjectId: vercelProjectId?.trim() || null,
      vercelProjectName: projectName,
    },
  });

  return NextResponse.json({
    connected: true,
    vercelProjectName: projectName,
    teamId: teamId?.trim() || null,
  });
}
