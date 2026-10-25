import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";
import { getFileContent } from "@/lib/github-api";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/integrations/github/file?projectId=xxx&path=src/index.ts
 *
 * Fetches the REAL content of a single file from the connected
 * GitHub repository.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const path = url.searchParams.get("path");

  if (!projectId || !path) {
    return NextResponse.json(
      { error: "Missing projectId or path" },
      { status: 400 }
    );
  }

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const integration = await db.gitHubIntegration.findUnique({
    where: { projectId },
    select: { accessToken: true, repoFullName: true, defaultBranch: true },
  });

  if (!integration) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  const [owner, repo] = integration.repoFullName.split("/");
  if (!owner || !repo) {
    return NextResponse.json({ error: "Invalid repo format" }, { status: 400 });
  }

  try {
    const result = await getFileContent(
      integration.accessToken,
      owner,
      repo,
      path,
      integration.defaultBranch
    );
    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({
      content: result.content,
      sha: result.sha,
      path,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
