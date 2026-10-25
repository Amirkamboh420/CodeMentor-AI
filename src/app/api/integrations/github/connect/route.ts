import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProjectOwnership } from "@/lib/integration-helpers";
import { verifyGitHubToken } from "@/lib/github-api";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/integrations/github/connect
 * Body: { projectId, accessToken, username, repoFullName, defaultBranch? }
 *
 * Verifies the PAT by calling the GitHub /user endpoint, then persists it.
 * The token is verified against the REAL GitHub API so we know it's valid
 * before saving.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    projectId,
    accessToken,
    username,
    repoFullName,
    defaultBranch,
  } = body as {
    projectId?: string;
    accessToken?: string;
    username?: string;
    repoFullName?: string;
    defaultBranch?: string;
  };

  if (!projectId || !accessToken || !repoFullName) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: projectId, accessToken, repoFullName",
      },
      { status: 400 }
    );
  }

  // Validate repo format: owner/repo
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repoFullName)) {
    return NextResponse.json(
      { error: "Repository must be in owner/repo format" },
      { status: 400 }
    );
  }

  const access = await requireProjectOwnership(projectId);
  if (!access.ok) return access.response;

  // Verify the token against the REAL GitHub API
  const verification = await verifyGitHubToken(accessToken);
  if (!verification.ok) {
    return NextResponse.json(
      { error: `GitHub token verification failed: ${verification.error}` },
      { status: 401 }
    );
  }

  // Use the verified username from GitHub (more reliable than user input)
  const realUsername = verification.username || username || "";

  const branch = defaultBranch?.trim() || "main";

  await db.gitHubIntegration.upsert({
    where: { projectId },
    create: {
      projectId,
      accessToken,
      username: realUsername,
      repoFullName,
      defaultBranch: branch,
    },
    update: {
      accessToken,
      username: realUsername,
      repoFullName,
      defaultBranch: branch,
    },
  });

  // Mirror repo metadata onto the project for convenience in lists / cards.
  await db.project.update({
    where: { id: projectId },
    data: {
      repoFullName,
      defaultBranch: branch,
      repoUrl: `https://github.com/${repoFullName}`,
      status: "github_synced",
    },
  });

  return NextResponse.json({
    connected: true,
    username: realUsername,
    repoFullName,
    defaultBranch: branch,
    verified: true,
  });
}

