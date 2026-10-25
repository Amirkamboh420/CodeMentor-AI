"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Loader2,
  Check,
  ExternalLink,
  Terminal,
  Copy,
  Circle,
  Cloud,
  Hammer,
  UploadCloud,
  Globe,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface VercelDeployDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeployed?: (url: string) => void;
}

type StepKey = "preparing" | "uploading" | "building" | "deploying" | "live";

interface Step {
  key: StepKey;
  label: string;
  icon: typeof Rocket;
  logLine: string;
}

const STEPS: Step[] = [
  {
    key: "preparing",
    label: "Preparing",
    icon: Circle,
    logLine: "Preparing build context…",
  },
  {
    key: "uploading",
    label: "Uploading",
    icon: UploadCloud,
    logLine: "Uploading build artifacts…",
  },
  {
    key: "building",
    label: "Building",
    icon: Hammer,
    logLine: "Running build command `next build`…",
  },
  {
    key: "deploying",
    label: "Deploying",
    icon: Cloud,
    logLine: "Promoting deployment to production…",
  },
  {
    key: "live",
    label: "Live",
    icon: Globe,
    logLine: "Deployment is live",
  },
];

interface DeployResult {
  url: string;
  deploymentId: string;
  projectName: string;
}

export function VercelDeployDialog({
  projectId,
  open,
  onOpenChange,
  onDeployed,
}: VercelDeployDialogProps) {
  const [phase, setPhase] = React.useState<"idle" | "deploying" | "done" | "error">(
    "idle"
  );
  const [currentStepIdx, setCurrentStepIdx] = React.useState(-1);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<DeployResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const logRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setPhase("idle");
      setCurrentStepIdx(-1);
      setLogs([]);
      setResult(null);
      setErrorMsg(null);
      setCopiedUrl(false);
    }
  }, [open]);

  // Auto-scroll the log panel to the bottom as new lines arrive.
  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const appendLog = React.useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const handleDeploy = async () => {
    if (phase === "deploying") return;
    setPhase("deploying");
    setLogs([]);
    setResult(null);
    setErrorMsg(null);
    setCurrentStepIdx(0);
    appendLog("[vercel] Initializing deployment…");

    // Simulate stepping through phases while the API request is in flight.
    // Real Vercel deployments are async — this mirrors the experience.
    let step = 0;
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    const advance = (idx: number) => {
      if (idx <= 0 || idx >= STEPS.length) return;
      stepTimers.push(
        setTimeout(() => {
          setCurrentStepIdx(idx);
          const s = STEPS[idx];
          appendLog(`[vercel] ${s.logLine}`);
        }, idx * 700)
      );
    };
    for (let i = 1; i < STEPS.length - 1; i++) advance(i);

    try {
      const res = await fetch("/api/integrations/vercel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.deployed) {
        throw new Error(data.error || "Deployment failed");
      }
      // Flush remaining timers and fast-forward to "live".
      stepTimers.forEach(clearTimeout);
      setCurrentStepIdx(STEPS.length - 1);
      appendLog(`[vercel] ${STEPS[STEPS.length - 1].logLine}`);
      appendLog(`[vercel] Deployment ready at ${data.url}`);
      appendLog(`[vercel] Deployment ID: ${data.deploymentId}`);
      setResult({
        url: data.url,
        deploymentId: data.deploymentId,
        projectName: data.projectName,
      });
      setPhase("done");
      toast.success("Deployment live", { description: data.url });
      onDeployed?.(data.url);
    } catch (err) {
      stepTimers.forEach(clearTimeout);
      const message =
        err instanceof Error ? err.message : "Deployment failed";
      appendLog(`[vercel] ✗ ${message}`);
      setErrorMsg(message);
      setPhase("error");
      toast.error("Deployment failed", { description: message });
    } finally {
      void step;
    }
  };

  const copyUrl = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    toast.success("URL copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">Deploy to Vercel</DialogTitle>
            <DialogDescription className="text-xs">
              Ship your project to production.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Stepper */}
          <ol className="space-y-2">
            {STEPS.map((step, idx) => {
              const isDone =
                (phase === "done" && idx <= STEPS.length - 1) ||
                idx < currentStepIdx;
              const isActive = phase !== "idle" && idx === currentStepIdx;
              const isPending = phase === "deploying" && idx > currentStepIdx;
              const Icon = step.icon;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-all",
                      isDone &&
                        "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
                      isActive &&
                        "border-foreground/40 bg-foreground/10 text-foreground",
                      isPending &&
                        "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3 w-3" />
                    ) : isActive && phase === "deploying" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      isDone && "text-emerald-600 dark:text-emerald-400",
                      isActive && "font-medium text-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {idx === STEPS.length - 1 && phase === "done" && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                    >
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Live
                      </span>
                    </motion.span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Deploy log */}
          {phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-lg border border-border bg-zinc-950"
            >
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-1.5">
                <Terminal className="h-3 w-3 text-zinc-500" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Deployment log
                </span>
              </div>
              <div
                ref={logRef}
                className="max-h-32 overflow-y-auto p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300"
              >
                {logs.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    <span className="text-zinc-600">{`>`} </span>
                    {line}
                  </div>
                ))}
                {phase === "deploying" && (
                  <div className="text-zinc-500">
                    <span className="text-zinc-600">{`>`} </span>
                    <span className="inline-block h-2 w-1.5 animate-pulse bg-zinc-400" />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Success: live URL */}
          <AnimatePresence>
            {phase === "done" && result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Live URL
                  </span>
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copiedUrl ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedUrl ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1 break-all font-mono text-xs text-emerald-700 dark:text-emerald-300">
                  {result.url}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {phase === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-300"
            >
              {errorMsg}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {phase === "done" && result ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                >
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Live Website
                  </a>
                </Button>
              </>
            ) : phase === "error" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDeploy}
                  className="h-9 gap-1.5"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={phase === "deploying"}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDeploy}
                  disabled={phase === "deploying"}
                  className="h-9 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
                >
                  {phase === "deploying" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deploying…
                    </>
                  ) : (
                    <>
                      <Rocket className="h-3.5 w-3.5" />
                      Deploy to Vercel
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
