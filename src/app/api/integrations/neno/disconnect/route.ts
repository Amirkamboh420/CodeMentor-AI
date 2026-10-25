import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * POST /api/integrations/neno/disconnect
 * Body: { projectId }
 * Removes the NenoIntegration record. The project itself is left intact.
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

  await db.nenoIntegration.deleteMany({ where: { projectId } });

  return NextResponse.json({ disconnected: true });
}
