import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";
import { listUserRepos } from "@/lib/github-api";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/integrations/github/repos?projectId=xxx
 *
 * Lists the user's real GitHub repositories using the stored PAT.
 * Used by the connect flow so users can pick a repo instead of typing it.
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
    return NextResponse.json({ repos: [], connected: false });
  }

  try {
    const repos = await listUserRepos(integration.accessToken, {
      perPage: 50,
      sort: "updated",
    });
    return NextResponse.json({
      repos,
      connected: true,
      currentRepo: integration.repoFullName,
      defaultBranch: integration.defaultBranch,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub API error";
    return NextResponse.json({ error: msg, repos: [] }, { status: 502 });
  }
}
