/**
 * Utilities for working with AI responses and conversations.
 */

/**
 * Extract all fenced code blocks from a markdown string.
 * Returns an array of { language, code }.
 */
export function extractCodeBlocks(
  markdown: string
): { language: string; code: string }[] {
  const blocks: { language: string; code: string }[] = [];
  const re = /```([\w-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].replace(/\n$/, ""),
    });
  }
  return blocks;
}

/**
 * Concatenate all code blocks into a single string (for "copy code only").
 */
export function extractAllCode(markdown: string): string {
  const blocks = extractCodeBlocks(markdown);
  if (blocks.length === 0) return "";
  if (blocks.length === 1) return blocks[0].code;
  return blocks
    .map(
      (b, i) =>
        `// === Block ${i + 1} (${b.language}) ===\n${b.code}`
    )
    .join("\n\n");
}

/**
 * Convert a list of chat messages to a markdown document for export.
 */
export function messagesToMarkdown(
  messages: {
    role: "user" | "assistant";
    content: string;
    requestType?: string;
    createdAt?: number;
  }[],
  title = "Conversation"
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(
    `> Exported from CodeMentor AI on ${new Date().toLocaleString()}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const m of messages) {
    const who = m.role === "user" ? "🧑 You" : "🤖 CodeMentor AI";
    const ts = m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString()
      : "";
    const tag = m.requestType ? ` [${m.requestType.toUpperCase()}]` : "";
    lines.push(`## ${who}${tag}${ts ? ` — _${ts}_` : ""}`);
    lines.push("");
    lines.push(m.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Trigger a client-side download of text content.
 */
export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain"
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Estimate word + token counts for a string.
 */
export function countStats(text: string): {
  words: number;
  tokens: number;
  lines: number;
} {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const tokens = Math.ceil(text.length / 4);
  const lines = text ? text.split("\n").length : 0;
  return { words, tokens, lines };
}

// ---------------------------------------------------------------------------
// Diff utilities
// ---------------------------------------------------------------------------

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  oldNum?: number;
  newNum?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  unchanged: number;
  identical: boolean;
}

/**
 * Compute a line-level diff between two strings using a simple
 * LCS (Longest Common Subsequence) algorithm.
 *
 * Returns an array of DiffLine entries suitable for rendering.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText ? oldText.split("\n") : [];
  const newLines = newText ? newText.split("\n") : [];

  // Trim leading/trailing empty lines for a cleaner diff
  while (oldLines.length > 0 && oldLines[0] === "") oldLines.shift();
  while (oldLines.length > 0 && oldLines[oldLines.length - 1] === "")
    oldLines.pop();
  while (newLines.length > 0 && newLines[0] === "") newLines.shift();
  while (newLines.length > 0 && newLines[newLines.length - 1] === "")
    newLines.pop();

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to produce the diff
  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let oldNum = 1;
  let newNum = 1;
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      lines.push({
        type: "unchanged",
        text: oldLines[i],
        oldNum,
        newNum,
      });
      unchanged++;
      i++;
      j++;
      oldNum++;
      newNum++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: "removed", text: oldLines[i], oldNum });
      removed++;
      i++;
      oldNum++;
    } else {
      lines.push({ type: "added", text: newLines[j], newNum });
      added++;
      j++;
      newNum++;
    }
  }
  while (i < m) {
    lines.push({ type: "removed", text: oldLines[i], oldNum });
    removed++;
    i++;
    oldNum++;
  }
  while (j < n) {
    lines.push({ type: "added", text: newLines[j], newNum });
    added++;
    j++;
    newNum++;
  }

  return {
    lines,
    added,
    removed,
    unchanged,
    identical: added === 0 && removed === 0,
  };
}

/**
 * Format a diff as a unified-diff-style plain text string (for export).
 */
export function diffToText(diff: DiffResult): string {
  return diff.lines
    .map((l) => {
      const prefix =
        l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  ";
      return prefix + l.text;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Word-level (intra-line) diff
// ---------------------------------------------------------------------------

export interface WordDiffSegment {
  text: string;
  type: "added" | "removed" | "unchanged";
}

/**
 * Compute word-level diff segments between two single-line strings.
 * Uses a simple LCS over word tokens. Useful for highlighting the exact
 * words that changed within a paired added/removed line pair.
 */
export function computeWordDiff(
  oldLine: string,
  newLine: string
): WordDiffSegment[] {
  // Tokenize into words + whitespace so we can reconstruct exactly
  const tokenize = (s: string) =>
 s.split(/(\s+)/).filter((t) => t.length > 0);
  const oldTokens = tokenize(oldLine);
  const newTokens = tokenize(newLine);
  const m = oldTokens.length;
  const n = newTokens.length;

  // LCS table over tokens
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const segments: WordDiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldTokens[i] === newTokens[j]) {
      segments.push({ text: oldTokens[i], type: "unchanged" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      segments.push({ text: oldTokens[i], type: "removed" });
      i++;
    } else {
      segments.push({ text: newTokens[j], type: "added" });
      j++;
    }
  }
  while (i < m) {
    segments.push({ text: oldTokens[i], type: "removed" });
    i++;
  }
  while (j < n) {
    segments.push({ text: newTokens[j], type: "added" });
    j++;
  }
  return segments;
}
