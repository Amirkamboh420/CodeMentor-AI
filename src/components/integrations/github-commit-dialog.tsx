"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  GitCommit,
  Loader2,
  Check,
  ExternalLink,
  Copy,
  FileCode2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface GithubCommitDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional pre-set list of changed files (path + content). */
  changedFiles?: Array<{ path: string; content: string }>;
  /** Optional default commit message suggestion override. */
  defaultMessage?: string;
  /** Called after a successful push — useful for refreshing workspace status. */
  onPushed?: (sha: string) => void;
}

interface CommitFile {
  path: string;
  content: string;
}

interface PushResult {
  sha: string;
  branch: string;
  repoFullName: string;
  htmlUrl: string;
  message: string;
  filesChanged: number;
}

export function GithubCommitDialog({
  projectId,
  open,
  onOpenChange,
  changedFiles,
  defaultMessage,
  onPushed,
}: GithubCommitDialogProps) {
  const initialMessage = defaultMessage ?? "feat: update project files";
  const [message, setMessage] = React.useState(initialMessage);
  const [files, setFiles] = React.useState<CommitFile[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<PushResult | null>(null);
  const [copiedSha, setCopiedSha] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMessage(initialMessage);
      setResult(null);
      setCopiedSha(false);
      setSubmitting(false);
      // Initialize files from props or a default starter file
      if (changedFiles && changedFiles.length > 0) {
        setFiles(changedFiles.map((f) => ({ path: f.path, content: f.content })));
      } else {
        setFiles([
          { path: "README.md", content: "# My Project\n\nUpdated via CodeMentor AI.\n" },
        ]);
      }
    }
  }, [open, initialMessage, changedFiles]);

  const updateFile = (idx: number, field: "path" | "content", value: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f))
    );
  };

  const addFile = () => {
    setFiles((prev) => [...prev, { path: "new-file.txt", content: "" }]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const validFiles = files.filter((f) => f.path.trim() && f.content);
    if (validFiles.length === 0) {
      toast.error("Add at least one file with content to commit");
      return;
    }
    const commitMessage = message.trim() || "chore: update project files";
    setSubmitting(true);
    try {
      const res = await fetch("/api/integrations/github/commit-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: commitMessage,
          files: validFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to push to GitHub");
      }
      const payload: PushResult = {
        sha: data.sha,
        branch: data.branch,
        repoFullName: data.repoFullName || "",
        htmlUrl: data.htmlUrl,
        message: commitMessage,
        filesChanged: data.filesChanged ?? validFiles.length,
      };
      setResult(payload);
      toast.success("Pushed to GitHub", {
        description: `Commit ${payload.sha.slice(0, 7)} → ${payload.branch}`,
      });
      onPushed?.(payload.sha);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to push to GitHub";
      toast.error("Push failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const copySha = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
    toast.success("Commit SHA copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Github className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">Commit & Push to GitHub</DialogTitle>
            <DialogDescription className="text-xs">
              Creates a real commit on your connected GitHub repository.
            </DialogDescription>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="space-y-4 p-5"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Pushed to {result.branch}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.filesChanged} file
                    {result.filesChanged === 1 ? "" : "s"} committed to{" "}
                    <span className="font-mono">{result.repoFullName}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Commit SHA
                  </span>
                  <button
                    onClick={copySha}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copiedSha ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSha ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1 break-all font-mono text-xs">{result.sha}</p>
                <p className="mt-2 line-clamp-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  &ldquo;{result.message}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  Done
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5"
                  asChild
                >
                  <a
                    href={result.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onSubmit={handlePush}
              className="space-y-4 p-5"
            >
              {/* Files to commit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    Files to commit
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {files.filter((f) => f.path.trim()).length} file
                    {files.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="space-y-1.5 rounded-md border border-border bg-card p-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <Input
                          value={f.path}
                          onChange={(e) => updateFile(idx, "path", e.target.value)}
                          placeholder="path/to/file.ts"
                          className="h-6 flex-1 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
                          aria-label="Remove file"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <Textarea
                        value={f.content}
                        onChange={(e) => updateFile(idx, "content", e.target.value)}
                        placeholder="File content…"
                        className="min-h-16 font-mono text-[11px]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFile}
                    className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Add file
                  </button>
                </div>
              </div>

              {/* Commit message */}
              <div className="space-y-1.5">
                <label htmlFor="gh-commit-msg" className="text-xs font-medium">
                  Commit message
                </label>
                <Textarea
                  id="gh-commit-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your changes…"
                  className="min-h-16 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Follow conventional commits (feat:, fix:, chore:, docs:).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Pushing…
                    </>
                  ) : (
                    <>
                      <GitCommit className="h-3.5 w-3.5" />
                      Commit & Push to GitHub
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
