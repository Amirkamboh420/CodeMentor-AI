"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Key,
  Users,
  Globe,
  ShieldCheck,
  Loader2,
  Check,
  ExternalLink,
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

export interface VercelConnectDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
  defaultProjectName?: string;
}

export function VercelConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnected,
  defaultProjectName,
}: VercelConnectDialogProps) {
  const [token, setToken] = React.useState("");
  const [teamId, setTeamId] = React.useState("");
  const [projectName, setProjectName] = React.useState(
    defaultProjectName ?? ""
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setToken("");
      setTeamId("");
      setProjectName(defaultProjectName ?? "");
      setSubmitting(false);
      setDone(false);
    }
  }, [open, defaultProjectName]);

  const canSubmit = token.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/integrations/vercel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          accessToken: token.trim(),
          teamId: teamId.trim() || undefined,
          vercelProjectName: projectName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.connected) {
        throw new Error(data.error || "Failed to connect Vercel");
      }
      setDone(true);
      toast.success("Vercel connected", {
        description: data.vercelProjectName
          ? `Project "${data.vercelProjectName}" linked`
          : "Project linked to Vercel",
      });
      onConnected?.();
      setTimeout(() => onOpenChange(false), 900);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect Vercel";
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
                <p className="text-base font-semibold">Vercel connected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your project is ready to deploy.
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
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-base">
                    Connect Vercel
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Deploy your project with a single click.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {/* Token */}
                <div className="space-y-1.5">
                  <Label htmlFor="vercel-token" className="text-xs">
                    Vercel Access Token
                  </Label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="vercel-token"
                      type="password"
                      autoComplete="off"
                      placeholder="vercel_xxxxxxxxxxxxxxxxxxxx"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-9 pl-8 font-mono text-xs"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Create one at{" "}
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      vercel.com/account/tokens
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>

                {/* Team ID (optional) */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="vercel-team"
                    className="flex items-center gap-1 text-xs"
                  >
                    Team ID
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="vercel-team"
                      type="text"
                      autoComplete="off"
                      placeholder="team_xxxxxxxxxxxx"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="h-9 pl-8 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Project name */}
                <div className="space-y-1.5">
                  <Label htmlFor="vercel-name" className="text-xs">
                    Project Name
                  </Label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="vercel-name"
                      type="text"
                      autoComplete="off"
                      placeholder="my-project"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-9 pl-8"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Used as the Vercel project name. Leave blank to use your
                    project name.
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
                        <Rocket className="h-3.5 w-3.5" />
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
