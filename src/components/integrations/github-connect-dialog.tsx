"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Key,
  User,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Check,
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
import { toast } from "sonner";

export interface GithubConnectDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
  /** Optional initial state if the workspace already knows the connection state. */
  defaultRepo?: string;
  defaultUsername?: string;
}

export function GithubConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnected,
  defaultRepo,
  defaultUsername,
}: GithubConnectDialogProps) {
  const [token, setToken] = React.useState("");
  const [username, setUsername] = React.useState(defaultUsername ?? "");
  const [repo, setRepo] = React.useState(defaultRepo ?? "");
  const [branch, setBranch] = React.useState("main");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // Reset internal state when dialog opens
  React.useEffect(() => {
    if (open) {
      setToken("");
      setUsername(defaultUsername ?? "");
      setRepo(defaultRepo ?? "");
      setBranch("main");
      setSubmitting(false);
      setDone(false);
    }
  }, [open, defaultRepo, defaultUsername]);

  const canSubmit =
    token.trim().length > 0 &&
    username.trim().length > 0 &&
    /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo.trim()) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/integrations/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          accessToken: token.trim(),
          username: username.trim(),
          repoFullName: repo.trim(),
          defaultBranch: branch.trim() || "main",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.connected) {
        throw new Error(data.error || "Failed to connect GitHub");
      }
      setDone(true);
      toast.success("GitHub connected", {
        description: `${data.username}/${data.repoFullName} on "${data.defaultBranch}"`,
      });
      onConnected?.();
      // Brief celebration, then close
      setTimeout(() => onOpenChange(false), 900);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect GitHub";
      toast.error("Connection failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center gap-3 p-8 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-semibold">GitHub connected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your repository is now linked to this project.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
            >
              <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                  <Github className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-base">
                    Connect GitHub
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Link a repository to commit & push your project.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {/* Token */}
                <div className="space-y-1.5">
                  <Label htmlFor="gh-token" className="text-xs">
                    Personal Access Token
                  </Label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gh-token"
                      type="password"
                      autoComplete="off"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-9 pl-8 font-mono text-xs"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Needs{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[9px]">
                      repo
                    </code>{" "}
                    scope.{" "}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Create a token
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="gh-user" className="text-xs">
                    GitHub Username
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gh-user"
                      type="text"
                      autoComplete="off"
                      placeholder="octocat"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-9 pl-8"
                      required
                    />
                  </div>
                </div>

                {/* Repo */}
                <div className="space-y-1.5">
                  <Label htmlFor="gh-repo" className="text-xs">
                    Repository
                  </Label>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gh-repo"
                      type="text"
                      autoComplete="off"
                      placeholder="owner/repo"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      className="h-9 pl-8 font-mono text-xs"
                      required
                    />
                  </div>
                  {repo.trim() &&
                    !/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo.trim()) && (
                      <p className="text-[10px] text-rose-500">
                        Use the format owner/repo
                      </p>
                    )}
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <Label htmlFor="gh-branch" className="text-xs">
                    Default Branch
                  </Label>
                  <div className="relative">
                    <GitBranch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gh-branch"
                      type="text"
                      autoComplete="off"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="h-9 pl-8"
                    />
                  </div>
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
                    disabled={!canSubmit}
                    className="h-9 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <Github className="h-3.5 w-3.5" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>

                <p className="flex items-start gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  <span>
                    Your token is stored securely on the backend and never
                    exposed to the frontend.
                  </span>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
