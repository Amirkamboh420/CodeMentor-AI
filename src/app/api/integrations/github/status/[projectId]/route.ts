import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * GET /api/integrations/github/status/[projectId]
 * Returns the GitHub connection status for the project. Tokens are NEVER
 * returned to the client — only metadata.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const integration = await db.gitHubIntegration.findUnique({
    where: { projectId },
    select: {
      username: true,
      repoFullName: true,
      defaultBranch: true,
      connectedAt: true,
    },
  });

  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    username: integration.username,
    repoFullName: integration.repoFullName,
    defaultBranch: integration.defaultBranch,
    connectedAt: integration.connectedAt,
  });
}
