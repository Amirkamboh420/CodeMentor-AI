import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * GET /api/integrations/neno/status/[projectId]
 * Returns the Neno connection status for the project. API keys are NEVER
 * returned to the client — only metadata.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const integration = await db.nenoIntegration.findUnique({
    where: { projectId },
    select: {
      environment: true,
      connectedAt: true,
    },
  });

  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    environment: integration.environment,
    connectedAt: integration.connectedAt,
  });
}
