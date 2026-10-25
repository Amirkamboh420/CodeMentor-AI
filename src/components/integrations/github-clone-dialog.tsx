"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  GitBranch,
  Download,
  Loader2,
  Check,
  ExternalLink,
  FolderGit2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GithubCloneDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  private: boolean;
  updatedAt: string;
}

export function GithubCloneDialog({
  projectId,
  open,
  onOpenChange,
}: GithubCloneDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [repos, setRepos] = React.useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(null);
  const [cloning, setCloning] = React.useState(false);
  const [cloned, setCloned] = React.useState<string | null>(null);

  const loadRepos = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/github/repos?projectId=${projectId}`
      );
      const data = await res.json();
      if (data.repos) {
        setRepos(data.repos);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    if (open) {
      setCloned(null);
      setSelectedRepo(null);
      loadRepos();
    }
  }, [open, loadRepos]);

  const handleClone = () => {
    if (!selectedRepo) return;
    const repo = repos.find((r) => r.fullName === selectedRepo);
    if (!repo) return;
    setCloning(true);
    // Use VS Code's git clone deep-link protocol — this opens VS Code
    // and prompts the user to pick a local folder to clone into.
    const cloneUrl = `vscode://vscode.git/clone?url=${encodeURIComponent(
      repo.url
    )}`;
    // Trigger the deep-link
    window.location.href = cloneUrl;
    setTimeout(() => {
      setCloning(false);
      setCloned(repo.url);
      toast.success("Opening VS Code clone dialog", {
        description: `${repo.fullName} → pick a local folder`,
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">
              Clone from GitHub
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pull an existing repo to your local device, then open in VS Code.
            </DialogDescription>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {cloned ? (
            <motion.div
              key="cloned"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 p-5"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    VS Code clone dialog opened
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {cloned}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
                <p className="font-medium">Next steps:</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>VS Code asks you to pick a local folder</li>
                  <li>The repo is cloned into that folder</li>
                  <li>VS Code opens the cloned project</li>
                  <li>
                    Set the cloned folder as this project&apos;s local path
                    (via &ldquo;Open Local Folder&rdquo;) to enable
                    &ldquo;Open in VS Code&rdquo;
                  </li>
                </ol>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 p-5"
            >
              <p className="text-xs text-muted-foreground">
                Select a repository from your GitHub account to clone locally:
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : repos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Github className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    No repositories found. Connect GitHub first.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => setSelectedRepo(repo.fullName)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                        selectedRepo === repo.fullName
                          ? "bg-emerald-500/10 ring-1 ring-emerald-500/40"
                          : "hover:bg-accent"
                      )}
                    >
                      <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {repo.fullName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {repo.defaultBranch} ·{" "}
                          {new Date(repo.updatedAt).toLocaleDateString()}
                          {repo.private && " · private"}
                        </p>
                      </div>
                      {selectedRepo === repo.fullName && (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedRepo || cloning}
                  onClick={handleClone}
                  className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                >
                  {cloning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Opening VS Code…
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Clone & Open in VS Code
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
