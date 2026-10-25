import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";

export const runtime = "nodejs";

const VALID_ENVS = ["production", "staging", "development"] as const;
type NenoEnv = (typeof VALID_ENVS)[number];

/**
 * POST /api/integrations/neno/connect
 * Body: { projectId, apiKey, environment? }
 *
 * Stores the Neno/Nano API key against the project. Neno is a third-party
 * analytics / data platform; the key is persisted (plaintext for dev —
 * encrypt in production).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId, apiKey, environment } = body as {
    projectId?: string;
    apiKey?: string;
    environment?: string;
  };

  if (!projectId || !apiKey) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, apiKey" },
      { status: 400 }
    );
  }

  const env: NenoEnv =
    environment && (VALID_ENVS as readonly string[]).includes(environment)
      ? (environment as NenoEnv)
      : "production";

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  await db.nenoIntegration.upsert({
    where: { projectId },
    create: {
      projectId,
      apiKey,
      environment: env,
    },
    update: {
      apiKey,
      environment: env,
    },
  });

  return NextResponse.json({
    connected: true,
    environment: env,
  });
}
