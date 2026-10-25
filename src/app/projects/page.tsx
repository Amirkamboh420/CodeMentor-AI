"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  FolderKanban,
  Plus,
  Github,
  Rocket,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  framework: string;
  status: string;
  localPath: string | null;
  lastDeployUrl: string | null;
  lastBuildAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { builds: number };
  githubConnected: boolean;
  vercelConnected: boolean;
  nenoConnected: boolean;
};

const FRAMEWORKS: { value: string; label: string; build: string; out: string; color: string; icon: string }[] = [
  { value: "nextjs", label: "Next.js", build: "bun run build", out: ".next", color: "bg-neutral-900 text-white", icon: "N" },
  { value: "react", label: "React (Vite)", build: "vite build", out: "dist", color: "bg-sky-500 text-white", icon: "R" },
  { value: "node", label: "Node.js", build: "tsc -p tsconfig.json", out: "dist", color: "bg-emerald-600 text-white", icon: "N" },
  { value: "static", label: "Static", build: "echo 'No build step'", out: "public", color: "bg-amber-500 text-white", icon: "S" },
];

function frameworkMeta(value: string) {
  return FRAMEWORKS.find((f) => f.value === value) ?? FRAMEWORKS[0];
}

// ---------------------------------------------------------------------------
// Status badge helpers (color-coded per task spec)
// ---------------------------------------------------------------------------

function statusBadgeClass(status: string): string {
  switch (status) {
    case "development":
      return "border-border bg-muted text-muted-foreground";
    case "changes_detected":
      return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "github_synced":
      return "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400";
    case "building":
      return "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse";
    case "ready":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "deploying":
      return "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
    case "live":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "error":
      return "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "development": return "Development";
    case "changes_detected": return "Changes Detected";
    case "github_synced": return "GitHub Synced";
    case "building": return "Building";
    case "ready": return "Ready";
    case "deploying": return "Deploying";
    case "live": return "Live";
    case "error": return "Error";
    default: return status;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  return (
    <AppLayout>
      <ProjectsList />
    </AppLayout>
  );
}

function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      toast.error("Failed to load projects", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreated = (id: string) => {
    setCreateOpen(false);
    toast.success("Project created", { description: "Redirecting to workspace..." });
    router.push(`/projects/${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage the full lifecycle: develop, sync to GitHub, build, deploy.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </header>

      {/* Body */}
      {loading ? (
        <ProjectGridSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </motion.div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onCreated}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project card
// ---------------------------------------------------------------------------

function ProjectCard({ project }: { project: ProjectListItem }) {
  const meta = frameworkMeta(project.framework);
  // Map framework bg-* class to a raw color value for the gradient bar.
  const barColor: Record<string, string> = {
    "bg-neutral-900 text-white": "#171717",
    "bg-sky-500 text-white": "#0ea5e9",
    "bg-emerald-600 text-white": "#059669",
    "bg-amber-500 text-white": "#f59e0b",
  };
  const barHex = barColor[meta.color] || "#10b981";
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
      }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="card-hover group relative h-full overflow-hidden py-0">
        {/* Top gradient bar — framework-colored */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(to right, ${barHex}, transparent 80%)`,
          }}
        />
        <CardContent className="flex flex-col gap-3 p-5 pt-6">
          {/* Top row: framework tile + name */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-transform duration-300 group-hover:scale-110",
                meta.color
              )}
              aria-hidden
            >
              {meta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold leading-tight">
                {project.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {meta.label}
              </p>
            </div>
            <Badge variant="outline" className={cn("h-6 shrink-0 text-[10px]", statusBadgeClass(project.status))}>
              {project.status === "live" && (
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              )}
              {project.status === "building" && (
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              )}
              {statusLabel(project.status)}
            </Badge>
          </div>

          {/* Description */}
          <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
            {project.description || "No description provided."}
          </p>

          {/* Integrations row */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 transition-colors",
                project.githubConnected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              )}
              title={project.githubConnected ? "GitHub connected" : "GitHub not connected"}
            >
              <Github className="h-3 w-3" />
              {project.githubConnected ? "GitHub" : "—"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 transition-colors",
                project.vercelConnected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              )}
              title={project.vercelConnected ? "Vercel connected" : "Vercel not connected"}
            >
              <Rocket className="h-3 w-3" />
              {project.vercelConnected ? "Vercel" : "—"}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {project._count.builds} build{project._count.builds === 1 ? "" : "s"}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">
              Updated {formatRelative(project.updatedAt)}
            </span>
            <Button asChild size="sm" variant="ghost" className="-mr-2 group/btn">
              <Link href={`/projects/${project.id}`}>
                Open
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <Skeleton className="mt-4 h-8 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <FolderKanban className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">No projects yet</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Create your first project to start the lifecycle — develop locally,
        sync to GitHub, build, and deploy to Vercel.
      </p>
      <Button onClick={onCreate} className="mt-5">
        <Plus className="h-4 w-4" />
        Create your first project
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Create project dialog
// ---------------------------------------------------------------------------

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [framework, setFramework] = React.useState("nextjs");
  const [buildCommand, setBuildCommand] = React.useState("bun run build");
  const [outputDir, setOutputDir] = React.useState(".next");
  const [submitting, setSubmitting] = React.useState(false);

  // Auto-fill build command + output dir based on the chosen framework.
  React.useEffect(() => {
    if (!open) return;
    const meta = frameworkMeta(framework);
    setBuildCommand(meta.build);
    setOutputDir(meta.out);
  }, [framework, open]);

  // Reset form when the dialog closes.
  React.useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setFramework("nextjs");
      setBuildCommand("bun run build");
      setOutputDir(".next");
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          framework,
          buildCommand,
          outputDir,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create project");
      }
      const data = await res.json();
      onCreated(data.project.id);
    } catch (err) {
      toast.error("Failed to create project", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project to start the development lifecycle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="proj-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-name"
              placeholder="my-awesome-app"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) submit();
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              placeholder="A short description of what this project does."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="min-h-[60px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <span className="flex items-center gap-2">
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold", f.color)}>
                        {f.icon}
                      </span>
                      {f.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="proj-build">Build command</Label>
              <Input
                id="proj-build"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proj-out">Output directory</Label>
              <Input
                id="proj-out"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for the workspace page.
export {
  statusBadgeClass,
  statusLabel,
  formatRelative,
  frameworkMeta,
  FRAMEWORKS,
};
