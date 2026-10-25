import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

/**
 * POST /api/integrations/neno/sync
 * Body: { projectId }
 *
 * Simulates a Neno project sync. In production this would push project
 * metadata / events into Neno via the platform's API using the stored key.
 * Here we simply confirm the sync.
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

  const integration = await db.nenoIntegration.findUnique({
    where: { projectId },
    select: { environment: true, connectedAt: true },
  });
  if (!integration) {
    return NextResponse.json(
      { error: "Neno is not connected to this project" },
      { status: 400 }
    );
  }

  // Mock: simulate the time a real sync would take.
  await new Promise((r) => setTimeout(r, 350));

  return NextResponse.json({
    ok: true,
    synced: true,
    environment: integration.environment,
    syncedAt: new Date().toISOString(),
    recordsPushed: Math.floor(Math.random() * 24) + 8,
  });
}
