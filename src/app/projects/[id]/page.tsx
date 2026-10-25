"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Folder,
  FileCode2,
  Code,
  GitBranch,
  Github,
  GitCommit,
  Hammer,
  CheckCircle2,
  Rocket,
  Globe,
  Settings as SettingsIcon,
  ExternalLink,
  AlertCircle,
  Plus,
  Terminal,
  Files,
  Pencil,
  FolderOpen,
  X,
  Check,
  Zap,
  Cloud,
  RefreshCw,
} from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  statusBadgeClass,
  statusLabel,
  formatRelative,
  frameworkMeta,
} from "@/app/projects/page";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BuildRun = {
  id: string;
  status: string;
  log: string;
  duration: number;
  createdAt: string;
};

type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: string;
  localPath: string | null;
  repoUrl: string | null;
  repoFullName: string | null;
  defaultBranch: string;
  lastBuildAt: string | null;
  lastDeployUrl: string | null;
  buildCommand: string;
  outputDir: string;
  envVars: string;
  createdAt: string;
  updatedAt: string;
  builds: BuildRun[];
  githubConnected: boolean;
  githubRepo: string | null;
  githubBranch: string | null;
  vercelConnected: boolean;
  vercelProjectName: string | null;
  nenoConnected: boolean;
  nenoEnvironment: string | null;
};

// ---------------------------------------------------------------------------
// Page wrapper (Suspense-free param read; useParams is safe in client)
// ---------------------------------------------------------------------------

export default function ProjectWorkspacePage() {
  return (
    <AppLayout>
      <Workspace />
    </AppLayout>
  );
}

function Workspace() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setProject(data.project);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <WorkspaceSkeleton />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Could not load project</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {error || "Project not found, or you don't have access to it."}
            </p>
            <Button variant="outline" onClick={() => router.push("/projects")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <ProjectWorkspace project={project} reload={load} setProject={setProject} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workspace skeleton
// ---------------------------------------------------------------------------

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="ml-auto h-9 w-32" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

function ProjectWorkspace({
  project,
  reload,
  setProject,
}: {
  project: ProjectDetail;
  reload: () => Promise<void>;
  setProject: React.Dispatch<React.SetStateAction<ProjectDetail | null>>;
}) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [vscodePathOpen, setVscodePathOpen] = React.useState(false);
  const [commitOpen, setCommitOpen] = React.useState(false);
  const [githubOpen, setGithubOpen] = React.useState(false);
  const [vercelOpen, setVercelOpen] = React.useState(false);
  const [nenoOpen, setNenoOpen] = React.useState(false);
  const [buildLogOpen, setBuildLogOpen] = React.useState(false);
  const [deployOpen, setDeployOpen] = React.useState(false);
  const [logPanelOpen, setLogPanelOpen] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  // Local copy of the project name for inline editing.
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(project.name);

  React.useEffect(() => setNameDraft(project.name), [project.name]);

  const updateProject = (patch: Partial<ProjectDetail>) =>
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));

  // ---------------------- VS Code deep-link ----------------------
  const openInVSCode = () => {
    if (!project.localPath) {
      setVscodePathOpen(true);
      return;
    }
    const url = `vscode://file/${encodeURIComponent(project.localPath).replace(/%2F/g, "/").replace(/%3A/g, ":")}`;
    toast.info("Opening VS Code...", {
      description: `Launching vscode:// with folder ${project.localPath}`,
    });
    // Use a hidden anchor to trigger the protocol handler.
    const a = document.createElement("a");
    a.href = url;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ---------------------- Build ----------------------
  const triggerBuild = async () => {
    setBusyAction("build");
    try {
      const res = await fetch(`/api/projects/${project.id}/build`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Build failed to start");
      }
      const data = await res.json();
      // Optimistic update — show building state.
      updateProject({
        status: "ready", // post-build status from server
        lastBuildAt: new Date().toISOString(),
        builds: [data.buildRun, ...project.builds].slice(0, 10),
      });
      toast.success(
        data.buildRun.status === "success"
          ? "Build succeeded"
          : "Build failed",
        {
          description:
            data.buildRun.status === "success"
              ? `Completed in ${(data.buildRun.duration / 1000).toFixed(2)}s`
              : "Check the build log for details.",
        }
      );
      setLogPanelOpen(true);
      await reload();
    } catch (err) {
      toast.error("Build failed", { description: (err as Error).message });
    } finally {
      setBusyAction(null);
    }
  };

  // ---------------------- Push to GitHub ----------------------
  const pushToGitHub = async () => {
    setBusyAction("push");
    try {
      // Simulate a push.
      await new Promise((r) => setTimeout(r, 1500));
      updateProject({ status: "github_synced" });
      toast.success("Pushed to GitHub", {
        description: project.githubRepo || "Changes pushed to default branch.",
      });
    } catch (err) {
      toast.error("Push failed", { description: (err as Error).message });
    } finally {
      setBusyAction(null);
    }
  };

  // ---------------------- Deploy ----------------------
  const triggerDeploy = async () => {
    setBusyAction("deploy");
    try {
      // Simulate deployment.
      updateProject({ status: "deploying" });
      await new Promise((r) => setTimeout(r, 2000));
      const url = `https://${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.vercel.app`;
      // Persist lastDeployUrl.
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastDeployUrl: url, status: "live" }),
      });
      updateProject({ status: "live", lastDeployUrl: url });
      toast.success("Deployment live!", { description: url });
    } catch (err) {
      toast.error("Deploy failed", { description: (err as Error).message });
      updateProject({ status: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  // ---------------------- Save name ----------------------
  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft === project.name) {
      setEditingName(false);
      return;
    }
    setBusyAction("rename");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      updateProject({ name: nameDraft.trim() });
      toast.success("Project renamed");
    } catch (err) {
      toast.error("Rename failed", { description: (err as Error).message });
      setNameDraft(project.name);
    } finally {
      setBusyAction(null);
      setEditingName(false);
    }
  };

  // ---------------------- Delete ----------------------
  const handleDelete = async () => {
    setBusyAction("delete");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err) {
      toast.error("Delete failed", { description: (err as Error).message });
      setBusyAction(null);
    }
  };

  const latestBuild = project.builds[0] || null;
  const meta = frameworkMeta(project.framework);

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      {/* ---------- Top bar ---------- */}
      <Card className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm",
                meta.color
              )}
              aria-hidden
            >
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="h-7 w-48 text-base font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") {
                          setNameDraft(project.name);
                          setEditingName(false);
                        }
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveName}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setNameDraft(project.name);
                        setEditingName(false);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="truncate text-xl font-semibold tracking-tight">
                      {project.name}
                    </h1>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setEditingName(true)}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Rename project"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Rename</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="h-5 text-[10px]">
                  {meta.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("h-5 text-[10px]", statusBadgeClass(project.status))}
                >
                  {project.status === "live" && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  )}
                  {statusLabel(project.status)}
                </Badge>
                {project.localPath && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Folder className="h-3 w-3" />
                    {project.localPath}
                  </span>
                )}
                <span>· Updated {formatRelative(project.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={openInVSCode} variant="default">
                    <Code className="h-4 w-4" />
                    Open in VS Code
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {project.localPath
                    ? `vscode://file/${project.localPath}`
                    : "Set your local path first"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Status flow stepper ---------- */}
      <StatusFlowStepper status={project.status} />

      {/* ---------- Action grid ---------- */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Lifecycle actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ActionButton
            icon={FolderOpen}
            label="Open Local Folder"
            sublabel={project.localPath ? "Path set" : "Set local path"}
            onClick={() => setVscodePathOpen(true)}
          />
          <ActionButton
            icon={Code}
            label="Open in VS Code"
            sublabel={project.localPath ? "Deep-link ready" : "Set local path"}
            disabled={!project.localPath}
            onClick={openInVSCode}
            accent="blue"
          />
          <ActionButton
            icon={Github}
            label="Connect GitHub"
            sublabel={project.githubConnected ? "Connected" : "Not connected"}
            connected={project.githubConnected}
            onClick={() => setGithubOpen(true)}
          />
          <ActionButton
            icon={GitCommit}
            label="Commit Changes"
            sublabel="Write a commit"
            onClick={() => setCommitOpen(true)}
          />
          <ActionButton
            icon={GitBranch}
            label="Push to GitHub"
            sublabel={project.githubConnected ? "Push to remote" : "GitHub required"}
            disabled={!project.githubConnected}
            loading={busyAction === "push"}
            onClick={pushToGitHub}
          />
          <ActionButton
            icon={Zap}
            label="Connect Neno"
            sublabel={project.nenoConnected ? "Connected" : "Not connected"}
            connected={project.nenoConnected}
            onClick={() => setNenoOpen(true)}
          />
          <ActionButton
            icon={Hammer}
            label="Build Project"
            sublabel={latestBuild ? `Last: ${statusLabel(latestBuild.status)}` : "Never built"}
            loading={busyAction === "build"}
            onClick={triggerBuild}
            accent="amber"
          />
          <ActionButton
            icon={Rocket}
            label="Connect Vercel"
            sublabel={project.vercelConnected ? "Connected" : "Not connected"}
            connected={project.vercelConnected}
            onClick={() => setVercelOpen(true)}
          />
          <ActionButton
            icon={Cloud}
            label="Deploy to Vercel"
            sublabel={
              project.vercelConnected
                ? project.lastDeployUrl
                  ? "Re-deploy"
                  : "Deploy now"
                : "Vercel required"
            }
            disabled={!project.vercelConnected}
            loading={busyAction === "deploy"}
            onClick={triggerDeploy}
            accent="indigo"
          />
          <ActionButton
            icon={Terminal}
            label="View Build Logs"
            sublabel={latestBuild ? formatRelative(latestBuild.createdAt) : "No builds yet"}
            disabled={!latestBuild}
            onClick={() => setBuildLogOpen(true)}
          />
          <ActionButton
            icon={Globe}
            label="Deployment Status"
            sublabel={project.lastDeployUrl ? "Live" : "Not deployed"}
            onClick={() => setDeployOpen(true)}
          />
          <ActionButton
            icon={ExternalLink}
            label="Open Live Website"
            sublabel={project.lastDeployUrl ? project.lastDeployUrl.replace(/^https?:\/\//, "") : "Not deployed"}
            disabled={!project.lastDeployUrl}
            onClick={() => {
              if (project.lastDeployUrl) {
                window.open(project.lastDeployUrl, "_blank", "noopener,noreferrer");
              }
            }}
            accent="emerald"
          />
        </div>
      </div>

      {/* ---------- Bottom row: file browser + log panel ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FileBrowser framework={project.framework} projectName={project.name} />
        <BuildLogPanel
          open={logPanelOpen}
          onOpenChange={setLogPanelOpen}
          build={latestBuild}
          onTriggerBuild={triggerBuild}
          building={busyAction === "build"}
        />
      </div>

      {/* ---------- Dialogs ---------- */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        project={project}
        onSaved={(patch) => {
          updateProject(patch);
        }}
        onDelete={handleDelete}
        deleting={busyAction === "delete"}
      />

      <VscodePathDialog
        open={vscodePathOpen}
        onOpenChange={setVscodePathOpen}
        project={project}
        onSaved={(localPath) => updateProject({ localPath })}
      />

      <CommitDialog
        open={commitOpen}
        onOpenChange={setCommitOpen}
        project={project}
        onCommitted={() => updateProject({ status: "changes_detected" })}
      />

      <ConnectDialog
        kind="github"
        open={githubOpen}
        onOpenChange={setGithubOpen}
        project={project}
        onConnected={() =>
          updateProject({
            githubConnected: true,
            githubRepo: `${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/repo`,
            githubBranch: project.defaultBranch,
            repoFullName: `${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/repo`,
            repoUrl: `https://github.com/${project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/repo`,
            status: project.status === "development" ? "changes_detected" : project.status,
          })
        }
      />
      <ConnectDialog
        kind="vercel"
        open={vercelOpen}
        onOpenChange={setVercelOpen}
        project={project}
        onConnected={() =>
          updateProject({
            vercelConnected: true,
            vercelProjectName: project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          })
        }
      />
      <ConnectDialog
        kind="neno"
        open={nenoOpen}
        onOpenChange={setNenoOpen}
        project={project}
        onConnected={() =>
          updateProject({
            nenoConnected: true,
            nenoEnvironment: "production",
          })
        }
      />

      <BuildLogDialog
        open={buildLogOpen}
        onOpenChange={setBuildLogOpen}
        builds={project.builds}
        onTriggerBuild={triggerBuild}
        building={busyAction === "build"}
      />

      <DeployStatusDialog
        open={deployOpen}
        onOpenChange={setDeployOpen}
        project={project}
        onRedeploy={triggerDeploy}
        deploying={busyAction === "deploy"}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status flow stepper
// ---------------------------------------------------------------------------

const STAGES = [
  { key: "project", label: "Project", icon: Folder, status: "development" },
  { key: "development", label: "Development", icon: Code, status: "development" },
  { key: "changes", label: "Changes Detected", icon: GitBranch, status: "changes_detected" },
  { key: "github", label: "GitHub Sync", icon: Github, status: "github_synced" },
  { key: "build", label: "Build", icon: Hammer, status: "building" },
  { key: "ready", label: "Ready", icon: CheckCircle2, status: "ready" },
  { key: "deploying", label: "Deployment", icon: Rocket, status: "deploying" },
  { key: "live", label: "Live", icon: Globe, status: "live" },
];

const STATUS_ORDER: Record<string, number> = {
  development: 1,
  changes_detected: 2,
  github_synced: 3,
  building: 4,
  ready: 5,
  deploying: 6,
  live: 7,
  error: 0,
};

function StatusFlowStepper({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  return (
    <Card className="py-0">
      <CardContent className="overflow-x-auto p-4">
        <div className="flex min-w-max items-center gap-1">
          {STAGES.map((stage, i) => {
            const stageIdx = i + 1; // project = 1
            const isDone = stageIdx < currentIdx;
            const isActive = stageIdx === currentIdx;
            const isPending = stageIdx > currentIdx;
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isDone && "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      isActive && "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse-glow",
                      isPending && "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isActive && "text-emerald-600 dark:text-emerald-400",
                      isDone && "text-emerald-600 dark:text-emerald-400",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className="relative mb-5 h-0.5 w-8 shrink-0 overflow-hidden rounded-full bg-border sm:w-12"
                    aria-hidden
                  >
                    <div
                      className={cn(
                        "absolute inset-0 origin-left rounded-full",
                        i + 1 < currentIdx ? "bg-emerald-500/60" : "bg-transparent"
                      )}
                      style={
                        i + 1 < currentIdx
                          ? { animation: "connector-fill 0.5s ease-out both" }
                          : undefined
                      }
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

type AccentColor = "default" | "blue" | "amber" | "indigo" | "emerald";

function ActionButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  disabled,
  loading,
  connected,
  accent = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  connected?: boolean;
  accent?: AccentColor;
}) {
  const accentClasses: Record<AccentColor, string> = {
    default: "bg-muted text-foreground",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { y: -3 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "group relative flex h-full w-full flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left shadow-sm transition-all",
        "hover:border-primary/30 hover:shadow-md",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:shadow-sm disabled:hover:translate-y-0"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            accentClasses[accent]
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-105" />
          )}
        </div>
        {connected && (
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px] shadow-emerald-500/30" title="Connected" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {sublabel && (
          <p className="truncate text-[11px] text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// File browser (mock)
// ---------------------------------------------------------------------------

type FileNode = {
  name: string;
  type: "dir" | "file";
  language?: string;
  content?: string;
  children?: FileNode[];
};

function buildMockTree(projectName: string, framework: string): FileNode {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const isNext = framework === "nextjs";
  return {
    name: "root",
    type: "dir",
    children: [
      {
        name: "src",
        type: "dir",
        children: [
          {
            name: "app",
            type: "dir",
            children: [
              {
                name: "page.tsx",
                type: "file",
                language: "tsx",
                content: `export default function Page() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-bold">${projectName}</h1>\n      <p>Welcome to your new ${framework} project.</p>\n    </main>\n  );\n}`,
              },
              { name: "layout.tsx", type: "file", language: "tsx", content: `export const metadata = { title: "${projectName}" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}` },
            ],
          },
          {
            name: "components",
            type: "dir",
            children: [
              { name: "Navbar.tsx", type: "file", language: "tsx", content: `export function Navbar() {\n  return <nav className="border-b p-4">${projectName}</nav>;\n}` },
              { name: "Footer.tsx", type: "file", language: "tsx", content: `export function Footer() {\n  return <footer className="p-4 text-sm text-muted">&copy; ${new Date().getFullYear()} ${projectName}</footer>;\n}` },
            ],
          },
          {
            name: "lib",
            type: "dir",
            children: [
              { name: "utils.ts", type: "file", language: "ts", content: `export function cn(...c: (string | undefined | false)[]) {\n  return c.filter(Boolean).join(" ");\n}` },
            ],
          },
        ],
      },
      {
        name: "public",
        type: "dir",
        children: [
          { name: "logo.svg", type: "file", content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#10b981"/></svg>` },
        ],
      },
      {
        name: "package.json",
        type: "file",
        language: "json",
        content: `{\n  "name": "${slug}",\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "${isNext ? "next dev" : "vite"}",\n    "build": "${isNext ? "next build" : "vite build"}",\n    "start": "${isNext ? "next start" : "vite preview"}"\n  }\n}`,
      },
      { name: "tsconfig.json", type: "file", language: "json", content: `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "esnext",\n    "jsx": "preserve",\n    "strict": true\n  }\n}` },
      { name: "README.md", type: "file", language: "markdown", content: `# ${projectName}\n\nThis project was created with CodeMentor AI.` },
    ],
  };
}

function FileBrowser({
  framework,
  projectName,
}: {
  framework: string;
  projectName: string;
}) {
  const tree = React.useMemo(() => buildMockTree(projectName, framework), [projectName, framework]);
  const [selected, setSelected] = React.useState<FileNode | null>(null);

  return (
    <Card className="py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Files className="h-4 w-4 text-muted-foreground" />
          Files
          <Badge variant="outline" className="ml-1 h-5 text-[10px] text-muted-foreground">
            mock
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-0 p-0 sm:grid-cols-2">
        <div className="max-h-80 overflow-y-auto border-r border-border p-2">
          <FileTreeNode node={tree} depth={0} selected={selected} onSelect={setSelected} />
        </div>
        <div className="max-h-80 overflow-auto">
          {selected ? (
            <pre className="m-0 p-3 text-xs leading-relaxed">
              <code className="font-mono">{selected.content}</code>
            </pre>
          ) : (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
              <FileCode2 className="h-8 w-8 opacity-40" />
              Select a file to preview its contents.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FileTreeNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  selected: FileNode | null;
  onSelect: (n: FileNode) => void;
}) {
  const [open, setOpen] = React.useState(depth < 2);
  if (node.name === "root") {
    return (
      <div>
        {node.children?.map((c) => (
          <FileTreeNode
            key={c.name}
            node={c}
            depth={depth}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }
  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-xs hover:bg-accent"
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          <ChevronRight
            className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
          />
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && (
          <div>
            {node.children?.map((c) => (
              <FileTreeNode
                key={c.name}
                node={c}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={() => onSelect(node)}
      className={cn(
        "flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-accent",
        selected?.name === node.name && "bg-accent"
      )}
      style={{ paddingLeft: depth * 12 + 22 }}
    >
      <FileCode2 className="h-3.5 w-3.5 text-sky-500" />
      <span className="truncate font-mono">{node.name}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Build log panel (collapsible)
// ---------------------------------------------------------------------------

function BuildLogPanel({
  open,
  onOpenChange,
  build,
  onTriggerBuild,
  building,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  build: BuildRun | null;
  onTriggerBuild: () => void;
  building: boolean;
}) {
  return (
    <Card className="py-0">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">Build log</span>
              {build && (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 text-[10px]",
                    build.status === "success" &&
                      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    build.status === "failed" &&
                      "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    build.status === "running" &&
                      "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse"
                  )}
                >
                  {build.status}
                </Badge>
              )}
              {building && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  building...
                </span>
              )}
            </div>
            <ChevronRight
              className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-zinc-950 p-4">
            {build ? (
              <>
                <pre className="m-0 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed text-emerald-300">
                  <code>{build.log}</code>
                  {(building || build.status === "running") && (
                    <span className="terminal-cursor" aria-hidden />
                  )}
                </pre>
                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>
                    {new Date(build.createdAt).toLocaleString()} ·{" "}
                    {(build.duration / 1000).toFixed(2)}s
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onTriggerBuild}
                    disabled={building}
                    className="h-7 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  >
                    {building ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 transition-transform duration-300 hover:rotate-180" />
                    )}
                    Rebuild
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-xs text-zinc-500">
                <Terminal className="h-6 w-6 opacity-40" />
                No build yet. Click <span className="text-emerald-400">Build Project</span> to start.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Settings dialog
// ---------------------------------------------------------------------------

function SettingsDialog({
  open,
  onOpenChange,
  project,
  onSaved,
  onDelete,
  deleting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail;
  onSaved: (patch: Partial<ProjectDetail>) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description);
  const [buildCommand, setBuildCommand] = React.useState(project.buildCommand);
  const [outputDir, setOutputDir] = React.useState(project.outputDir);
  const [envVars, setEnvVars] = React.useState(project.envVars);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description);
      setBuildCommand(project.buildCommand);
      setOutputDir(project.outputDir);
      setEnvVars(project.envVars);
    }
  }, [open, project]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || project.name,
          description,
          buildCommand,
          outputDir,
          envVars,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved({ name: name.trim() || project.name, description, buildCommand, outputDir, envVars });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (err) {
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>
            Update project metadata, build configuration, and environment variables.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-name">Name</Label>
            <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-desc">Description</Label>
            <Textarea
              id="set-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="set-build">Build command</Label>
              <Input
                id="set-build"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="set-out">Output directory</Label>
              <Input
                id="set-out"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-env">Environment variables (keys only)</Label>
            <Textarea
              id="set-env"
              placeholder={"NEXT_PUBLIC_API_URL\nDATABASE_URL\nSTRIPE_SECRET_KEY"}
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
              rows={3}
              className="min-h-[80px] font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              One key per line. Values are stored separately (display only).
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-3 sm:flex-col sm:gap-3">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              Delete project
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// VS Code path dialog
// ---------------------------------------------------------------------------

function VscodePathDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail;
  onSaved: (localPath: string) => void;
}) {
  const [path, setPath] = React.useState(project.localPath || "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setPath(project.localPath || "");
  }, [open, project.localPath]);

  const save = async () => {
    if (!path.trim()) {
      toast.error("Local path is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPath: path.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save path");
      onSaved(path.trim());
      toast.success("Local path saved", {
        description: "You can now use Open in VS Code.",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-500" />
            Local project path
          </DialogTitle>
          <DialogDescription>
            Browsers can&apos;t directly access your local filesystem for security.
            Provide your local project folder path so we can build a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">vscode://</code>{" "}
            deep-link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="path-input">Absolute path</Label>
          <Input
            id="path-input"
            placeholder="/Users/you/projects/my-app"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="font-mono text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) save();
            }}
          />
          <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-300">
            <p className="mb-1 flex items-center gap-1 font-medium">
              <Code className="h-3 w-3" />
              How it works
            </p>
            <p>
              Clicking <strong>Open in VS Code</strong> navigates to{" "}
              <code className="font-mono">vscode://file/&lt;your-path&gt;</code>,
              which launches VS Code with the correct folder open.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !path.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save &amp; open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Commit dialog
// ---------------------------------------------------------------------------

function CommitDialog({
  open,
  onOpenChange,
  project,
  onCommitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail;
  onCommitted: () => void;
}) {
  const [message, setMessage] = React.useState("");
  const [committing, setCommitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  const commit = async () => {
    if (!message.trim()) {
      toast.error("Commit message is required");
      return;
    }
    setCommitting(true);
    try {
      // Simulate commit + push.
      await new Promise((r) => setTimeout(r, 1200));
      onCommitted();
      toast.success("Changes committed & pushed", {
        description: `“${message.trim().slice(0, 60)}${message.length > 60 ? "..." : ""}”`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Commit failed", { description: (err as Error).message });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-violet-500" />
            Commit changes
          </DialogTitle>
          <DialogDescription>
            {project.githubConnected
              ? `Push to ${project.githubRepo || "GitHub"} on ${project.defaultBranch}.`
              : "Connect GitHub first to push commits."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="commit-msg">Commit message</Label>
          <Textarea
            id="commit-msg"
            placeholder="feat: add user authentication flow"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="min-h-[80px]"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Files staged: 3 modified, 1 added
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={committing}>
            Cancel
          </Button>
          <Button
            onClick={commit}
            disabled={committing || !message.trim() || !project.githubConnected}
          >
            {committing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitCommit className="h-4 w-4" />
            )}
            Commit &amp; Push
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Connect dialog (shared for GitHub / Vercel / Neno)
// ---------------------------------------------------------------------------

type ConnectKind = "github" | "vercel" | "neno";

function ConnectDialog({
  kind,
  open,
  onOpenChange,
  project,
  onConnected,
}: {
  kind: ConnectKind;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail;
  onConnected: () => void;
}) {
  const [token, setToken] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);

  React.useEffect(() => {
    if (open) setToken("");
  }, [open]);

  const config = {
    github: {
      title: "Connect GitHub",
      icon: Github,
      color: "text-zinc-700 dark:text-zinc-300",
      desc: "Authorize CodeMentor to access your GitHub repositories. We&apos;ll create a repo on first push.",
      placeholder: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      tokenLabel: "Personal access token",
      cta: "Connect GitHub",
      note: "Required scopes: repo, workflow",
    },
    vercel: {
      title: "Connect Vercel",
      icon: Rocket,
      color: "text-zinc-700 dark:text-zinc-300",
      desc: "Link your Vercel account to deploy this project with one click.",
      placeholder: "vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      tokenLabel: "Vercel access token",
      cta: "Connect Vercel",
      note: "Create at vercel.com/account/tokens",
    },
    neno: {
      title: "Connect Neno/Nano",
      icon: Zap,
      color: "text-amber-500",
      desc: "Link your Neno/Nano environment for analytics and monitoring.",
      placeholder: "nano_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      tokenLabel: "API key",
      cta: "Connect Neno",
      note: "Find your API key in the Neno dashboard",
    },
  }[kind];

  const Icon = config.icon;
  const alreadyConnected =
    (kind === "github" && project.githubConnected) ||
    (kind === "vercel" && project.vercelConnected) ||
    (kind === "neno" && project.nenoConnected);

  const connect = async () => {
    if (!token.trim()) {
      toast.error("Token is required");
      return;
    }
    setConnecting(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      onConnected();
      toast.success(config.title.replace("Connect ", "") + " connected");
      onOpenChange(false);
    } catch (err) {
      toast.error("Connection failed", { description: (err as Error).message });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", config.color)} />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.desc}</DialogDescription>
        </DialogHeader>
        {alreadyConnected ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Already connected</p>
              <p className="text-xs text-muted-foreground">
                {kind === "github" && project.githubRepo}
                {kind === "vercel" && project.vercelProjectName}
                {kind === "neno" && project.nenoEnvironment}
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 py-2">
              <Label htmlFor="connect-token">{config.tokenLabel}</Label>
              <Input
                id="connect-token"
                placeholder={config.placeholder}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="password"
                className="font-mono text-xs"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">{config.note}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={connecting}>
                Cancel
              </Button>
              <Button onClick={connect} disabled={connecting || !token.trim()}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {config.cta}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Build log dialog (history)
// ---------------------------------------------------------------------------

function BuildLogDialog({
  open,
  onOpenChange,
  builds,
  onTriggerBuild,
  building,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  builds: BuildRun[];
  onTriggerBuild: () => void;
  building: boolean;
}) {
  const [active, setActive] = React.useState<string | null>(builds[0]?.id ?? null);
  React.useEffect(() => {
    if (open && !active && builds[0]) setActive(builds[0].id);
  }, [open, active, builds]);
  const current = builds.find((b) => b.id === active) || builds[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-500" />
            Build history
          </DialogTitle>
          <DialogDescription>
            {builds.length} build{builds.length === 1 ? "" : "s"} recorded.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
          {/* Build list */}
          <div className="max-h-80 overflow-y-auto rounded-md border border-border p-1">
            {builds.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No builds yet.</p>
            ) : (
              builds.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActive(b.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                    current?.id === b.id && "bg-accent"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium">
                      {new Date(b.createdAt).toLocaleString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-4 text-[9px]",
                        b.status === "success" &&
                          "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        b.status === "failed" &&
                          "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        b.status === "running" &&
                          "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {(b.duration / 1000).toFixed(2)}s
                  </span>
                </button>
              ))
            )}
          </div>
          {/* Log content */}
          <div className="max-h-80 overflow-auto rounded-md bg-zinc-950 p-3">
            {current ? (
              <pre className="m-0 font-mono text-xs leading-relaxed text-emerald-300">
                <code>{current.log}</code>
              </pre>
            ) : (
              <p className="p-4 text-xs text-zinc-500">No build selected.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onTriggerBuild} disabled={building}>
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4" />}
            Trigger new build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Deployment status dialog
// ---------------------------------------------------------------------------

function DeployStatusDialog({
  open,
  onOpenChange,
  project,
  onRedeploy,
  deploying,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectDetail;
  onRedeploy: () => void;
  deploying: boolean;
}) {
  const live = project.status === "live" && project.lastDeployUrl;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Deployment status
          </DialogTitle>
          <DialogDescription>
            {live
              ? "Your project is live on Vercel."
              : "This project hasn't been deployed yet."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-2 w-2 rounded-full",
                  live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground"
                )}
              />
              <span className="text-sm font-medium">
                {live ? "Live" : "Not deployed"}
              </span>
            </div>
            {project.lastBuildAt && (
              <span className="text-xs text-muted-foreground">
                Last build: {formatRelative(project.lastBuildAt)}
              </span>
            )}
          </div>
          {project.lastDeployUrl && (
            <div className="flex flex-col gap-2">
              <Label>URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={project.lastDeployUrl}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (project.lastDeployUrl) {
                      window.open(project.lastDeployUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {project.vercelProjectName && (
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Vercel project</Label>
              <p className="font-mono text-xs text-muted-foreground">
                {project.vercelProjectName}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={onRedeploy}
            disabled={deploying || !project.vercelConnected}
          >
            {deploying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {project.lastDeployUrl ? "Re-deploy" : "Deploy now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
