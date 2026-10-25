import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * POST /api/integrations/github/disconnect
 * Body: { projectId }
 * Removes the GitHubIntegration record. The project itself is left intact.
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

  await db.gitHubIntegration.deleteMany({ where: { projectId } });

  return NextResponse.json({ disconnected: true });
}
