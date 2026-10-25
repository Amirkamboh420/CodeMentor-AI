import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";
import { getRepoTree } from "@/lib/github-api";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/integrations/github/tree?projectId=xxx
 *
 * Fetches the REAL file tree of the connected GitHub repository
 * so the project workspace file browser shows actual repo contents.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId" },
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
    return NextResponse.json({ tree: [], connected: false });
  }

  const [owner, repo] = integration.repoFullName.split("/");
  if (!owner || !repo) {
    return NextResponse.json({ error: "Invalid repo format" }, { status: 400 });
  }

  try {
    const tree = await getRepoTree(
      integration.accessToken,
      owner,
      repo,
      integration.defaultBranch
    );
    return NextResponse.json({
      tree,
      connected: true,
      repo: integration.repoFullName,
      branch: integration.defaultBranch,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub API error";
    return NextResponse.json({ error: msg, tree: [] }, { status: 502 });
  }
}
