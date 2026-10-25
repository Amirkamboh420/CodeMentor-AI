/**
 * Real GitHub API integration using the Git Data API.
 *
 * This performs genuine git operations (commit + push) by calling the
 * GitHub REST API directly with the stored Personal Access Token:
 *
 *   1. Get the current commit SHA of the branch ref
 *   2. Get the tree SHA that commit points to
 *   3. Create blobs for the changed files
 *   4. Create a new tree referencing the blobs + base tree
 *   5. Create a commit with the new tree, parent = current commit
 *   6. Update the ref (branch) to point to the new commit
 *
 * This is exactly how `git commit && git push` works under the hood,
 * but over HTTPS to GitHub's API.
 *
 * Reference: https://docs.github.com/en/rest/git
 */

const GITHUB_API = "https://api.github.com";

interface GitHubFile {
  path: string;
  content: string; // utf-8 text content
  mode?: "100644" | "100755"; // file mode, default 100644
}

interface GitHubCommitResult {
  sha: string;
  htmlUrl: string;
  message: string;
  branch: string;
  filesChanged: number;
}

async function ghFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

/** Verify a GitHub PAT by fetching the authenticated user. */
export async function verifyGitHubToken(
  token: string
): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const res = await ghFetch("/user", token);
    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: "Invalid token" };
      if (res.status === 403)
        return { ok: false, error: "Token lacks required scopes (needs repo)" };
      return { ok: false, error: `GitHub API error: ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, username: data.login };
  } catch {
    return { ok: false, error: "Network error reaching GitHub" };
  }
}

/** List a user's repositories (for the connect flow). */
export async function listUserRepos(
  token: string,
  opts: { perPage?: number; sort?: string } = {}
): Promise<
  Array<{
    id: number;
    name: string;
    fullName: string;
    url: string;
    defaultBranch: string;
    private: boolean;
    updatedAt: string;
  }>
> {
  const perPage = opts.perPage || 50;
  const sort = opts.sort || "updated";
  const res = await ghFetch(
    `/user/repos?per_page=${perPage}&sort=${sort}&type=owner`,
    token
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return (data as unknown[]).map((r) => {
    const repo = r as {
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      default_branch: string;
      private: boolean;
      updated_at: string;
    };
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      private: repo.private,
      updatedAt: repo.updated_at,
    };
  });
}

/** Get the contents of a file in a repo (for the file browser). */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string } | null> {
  const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${refParam}`,
    token
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type !== "file" || !data.content) return null;
  // GitHub returns base64-encoded content
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

/** Get the full file tree of a repo (for the file browser). */
export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<
  Array<{ path: string; type: "blob" | "tree"; size?: number }>
> {
  // Get the branch's commit SHA
  const branchRes = await ghFetch(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
    token
  );
  if (!branchRes.ok) throw new Error(`Branch not found: ${branch}`);
  const branchData = await branchRes.json();
  const commitSha = branchData.commit.sha;

  // Get the tree (recursive)
  const treeRes = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
    token
  );
  if (!treeRes.ok) throw new Error("Failed to fetch repo tree");
  const treeData = await treeRes.json();
  return (treeData.tree as Array<{ path: string; type: string; size?: number }>)
    .filter((t) => t.type === "blob" || t.type === "tree")
    .map((t) => ({
      path: t.path,
      type: t.type as "blob" | "tree",
      size: t.size,
    }));
}

/**
 * Create a commit + update the branch ref — a real "commit & push".
 *
 * @param token GitHub PAT
 * @param owner repo owner
 * @param repo repo name
 * @param branch target branch
 * @param message commit message
 * @param files array of { path, content } to commit
 */
export async function createCommitAndPush(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  message: string,
  files: GitHubFile[]
): Promise<GitHubCommitResult> {
  // 1. Get the reference SHA for the branch
  const refRes = await ghFetch(
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    token
  );
  if (!refRes.ok) {
    if (refRes.status === 404) {
      throw new Error(`Branch "${branch}" not found. Create it first.`);
    }
    throw new Error(`Failed to get branch ref: ${refRes.status}`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  // 2. Get the commit (to find its tree SHA)
  const commitRes = await ghFetch(
    `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
    token
  );
  if (!commitRes.ok) throw new Error("Failed to get latest commit");
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for each file
  const treeItems = [];
  for (const file of files) {
    const blobRes = await ghFetch(
      `/repos/${owner}/${repo}/git/blobs`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      }
    );
    if (!blobRes.ok) throw new Error(`Failed to create blob for ${file.path}`);
    const blobData = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: file.mode || "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // 4. Create a new tree
  const treeRes = await ghFetch(`/repos/${owner}/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
  if (!treeRes.ok) throw new Error("Failed to create tree");
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 5. Create the commit
  const newCommitRes = await ghFetch(
    `/repos/${owner}/${repo}/git/commits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    }
  );
  if (!newCommitRes.ok) throw new Error("Failed to create commit");
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 6. Update the ref (this is the "push")
  const updateRefRes = await ghFetch(
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    }
  );
  if (!updateRefRes.ok) throw new Error("Failed to update branch ref (push)");
  const updatedRef = await updateRefRes.json();

  return {
    sha: newCommitSha,
    htmlUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
    message,
    branch: updatedRef.ref.replace("refs/heads/", ""),
    filesChanged: files.length,
  };
}
