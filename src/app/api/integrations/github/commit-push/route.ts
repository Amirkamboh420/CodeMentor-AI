import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";
import { createCommitAndPush } from "@/lib/github-api";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/integrations/github/commit-push
 * Body: { projectId, message, files: [{ path, content }] }
 *
 * Performs a REAL git commit + push via the GitHub Git Data API
 * using the stored Personal Access Token. Creates blobs → tree →
 * commit → updates the branch ref. This is exactly how `git commit
 * && git push` works, but over HTTPS to GitHub's API.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId, message, files } = body as {
    projectId?: string;
    message?: string;
    files?: Array<{ path: string; content: string }>;
  };

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required field: projectId" },
      { status: 400 }
    );
  }

  const commitMessage =
    (message && message.trim()) || "chore: update project files";

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "No files to commit. Add at least one file." },
      { status: 400 }
    );
  }

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  const integration = await db.gitHubIntegration.findUnique({
    where: { projectId },
    select: {
      accessToken: true,
      defaultBranch: true,
      repoFullName: true,
      username: true,
    },
  });
  if (!integration) {
    return NextResponse.json(
      { error: "GitHub is not connected to this project" },
      { status: 400 }
    );
  }

  // Parse owner/repo from repoFullName
  const [owner, repo] = integration.repoFullName.split("/");
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Invalid repository format. Expected owner/repo." },
      { status: 400 }
    );
  }

  try {
    const result = await createCommitAndPush(
      integration.accessToken,
      owner,
      repo,
      integration.defaultBranch,
      commitMessage,
      files.map((f) => ({ path: f.path, content: f.content }))
    );

    // Update project status + repo metadata
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "github_synced",
        repoUrl: `https://github.com/${integration.repoFullName}`,
        repoFullName: integration.repoFullName,
        defaultBranch: integration.defaultBranch,
      },
    });

    return NextResponse.json({
      ok: true,
      sha: result.sha,
      htmlUrl: result.htmlUrl,
      branch: result.branch,
      filesChanged: result.filesChanged,
      message: result.message,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub API error";
    console.error("[github/commit-push] error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
