"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Key,
  ShieldCheck,
  Loader2,
  Check,
  RefreshCw,
  Settings2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface NenoConnectDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

type Phase = "form" | "connected" | "syncing" | "synced";

interface SyncResult {
  synced: boolean;
  environment: string;
  syncedAt: string;
  recordsPushed: number;
}

export function NenoConnectDialog({
  projectId,
  open,
  onOpenChange,
  onConnected,
}: NenoConnectDialogProps) {
  const [apiKey, setApiKey] = React.useState("");
  const [environment, setEnvironment] = React.useState("production");
  const [phase, setPhase] = React.useState<Phase>("form");
  const [submitting, setSubmitting] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<SyncResult | null>(null);

  React.useEffect(() => {
    if (open) {
      setApiKey("");
      setEnvironment("production");
      setPhase("form");
      setSubmitting(false);
      setSyncResult(null);
    }
  }, [open]);

  const canSubmit = apiKey.trim().length > 0 && !submitting;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/integrations/neno/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          apiKey: apiKey.trim(),
          environment,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.connected) {
        throw new Error(data.error || "Failed to connect Neno");
      }
      setPhase("connected");
      toast.success("Neno connected", {
        description: `Environment: ${data.environment}`,
      });
      onConnected?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect Neno";
      toast.error("Connection failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (phase === "syncing") return;
    setPhase("syncing");
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/neno/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.synced) {
        throw new Error(data.error || "Sync failed");
      }
      setSyncResult({
        synced: true,
        environment: data.environment,
        syncedAt: data.syncedAt,
        recordsPushed: data.recordsPushed,
      });
      setPhase("synced");
      toast.success("Project synced", {
        description: `${data.recordsPushed} records pushed to Neno`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error("Sync failed", { description: message });
      setPhase("connected");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Cloud className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">
              Connect Neno / Nano
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sync your project data with Neno.
            </DialogDescription>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleConnect}
              className="space-y-4 p-5"
            >
              {/* API key */}
              <div className="space-y-1.5">
                <Label htmlFor="neno-key" className="text-xs">
                  Neno / Nano API Key
                </Label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="neno-key"
                    type="password"
                    autoComplete="off"
                    placeholder="nano_xxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-9 pl-8 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              {/* Environment */}
              <div className="space-y-1.5">
                <Label htmlFor="neno-env" className="text-xs">
                  Environment
                </Label>
                <Select
                  value={environment}
                  onValueChange={(v) => setEnvironment(v)}
                >
                  <SelectTrigger
                    id="neno-env"
                    className="h-9 w-full"
                  >
                    <span className="flex items-center gap-2 capitalize">
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
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
                      <Cloud className="h-3.5 w-3.5" />
                      Connect
                    </>
                  )}
                </Button>
              </div>

              <p className="flex items-start gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span>
                  Your API key is stored securely on the backend and never
                  exposed to the frontend.
                </span>
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 p-5"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  {phase === "synced" ? (
                    <Check className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Cloud className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold">
                    {phase === "synced" ? "Sync complete" : "Neno connected"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Environment:{" "}
                    <span className="font-mono">
                      {syncResult?.environment ?? environment}
                    </span>
                  </p>
                </div>
              </div>

              {/* Sync result card */}
              <AnimatePresence>
                {syncResult && phase === "synced" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Records pushed
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {syncResult.recordsPushed}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-1">
                      <span className="text-muted-foreground">Synced at</span>
                      <span className="font-mono">
                        {new Date(syncResult.syncedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-xs"
                >
                  Done
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSync}
                  disabled={phase === "syncing"}
                  className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                >
                  {phase === "syncing" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Syncing…
                    </>
                  ) : phase === "synced" ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-sync Project
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync Project
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
