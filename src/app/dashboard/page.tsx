"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  FileCode2,
  ThumbsUp,
  Hash,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Pin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type RequestTypeBadgeVariant = {
  label: string;
  className: string;
};

const REQUEST_TYPE_BADGE: Record<string, RequestTypeBadgeVariant> = {
  generate: {
    label: "Generate",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  refactor: {
    label: "Refactor",
    className:
      "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  explain: {
    label: "Explain",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  debug: {
    label: "Debug",
    className:
      "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

function badgeForType(type: string): RequestTypeBadgeVariant {
  return REQUEST_TYPE_BADGE[type?.toLowerCase()] || {
    label: type,
    className: "border-border bg-muted text-muted-foreground",
  };
}

interface Stats {
  conversations: number;
  messages: number;
  snippets: number;
  feedback: {
    total: number;
    helpful: number;
    partial: number;
    no: number;
    codeWorked: number;
    satisfactionRate: number;
  };
  byRequestType: { type: string; count: number }[];
  totalTokens: number;
}

interface Conversation {
  id: string;
  title: string;
  requestType: string;
  updatedAt: string;
  createdAt: string;
  pinned: boolean;
  tags: string;
  _count: { messages: number };
  totalTokens: number;
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString();
}

type IconType = React.ComponentType<{ className?: string }>;

/**
 * Lightweight count-up animation: animates a number from 0 → target over
 * ~700ms using requestAnimationFrame. Only transforms the textContent —
 * no layout thrash. Renders a fallback while the parent is loading.
 */
function useCountUp(target: number, enabled: boolean, duration = 700) {
  const [value, setValue] = React.useState(0);
  const ref = React.useRef<number>(0);
  React.useEffect(() => {
    if (!enabled) {
      setValue(0);
      ref.current = 0;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = ref.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      ref.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, enabled, duration]);
  return value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  loading,
  trend,
  isPercentage = false,
}: {
  icon: IconType;
  label: string;
  value: number;
  hint?: string;
  accent: string;
  loading: boolean;
  trend?: string;
  isPercentage?: boolean;
}) {
  const animated = useCountUp(value, !loading && value > 0);
  const display = loading
    ? "—"
    : isPercentage
      ? `${animated}%`
      : animated.toLocaleString();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="card-hover group h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 ${accent}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {loading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              display
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {trend && !loading && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5" />
                {trend}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/conversations").then((r) => r.json()),
    ])
      .then(([s, c]) => {
        if (cancelled) return;
        setStats(s);
        setConversations(c.conversations || []);
      })
      .catch(() => {
        // ignore — stats are non-critical
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recent = conversations.slice(0, 5);
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-6 -top-6 -z-10 h-24 w-24 rounded-full bg-emerald-500/15 blur-2xl"
            />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {firstName ? (
                <>
                  Welcome back,{" "}
                  <span className="text-gradient">{firstName}</span>
                </>
              ) : (
                "Dashboard"
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your personal workspace overview.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="group">
              <Link href="/snippets">
                <FileCode2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                View snippets
              </Link>
            </Button>
            <Button asChild className="group">
              <Link href="/assistant">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                New conversation
              </Link>
            </Button>
          </div>
        </motion.div>

        <Separator className="my-6" />

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="Conversations"
            value={stats?.conversations ?? 0}
            hint="Total chats"
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            loading={loading}
            trend={
              !loading && (stats?.conversations ?? 0) > 0 ? "active" : undefined
            }
          />
          <StatCard
            icon={Hash}
            label="Messages"
            value={stats?.messages ?? 0}
            hint="Across all chats"
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            loading={loading}
          />
          <StatCard
            icon={FileCode2}
            label="Snippets"
            value={stats?.snippets ?? 0}
            hint="Saved code blocks"
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            loading={loading}
          />
          <StatCard
            icon={ThumbsUp}
            label="Satisfaction"
            value={stats?.feedback?.satisfactionRate ?? 0}
            hint={`${stats?.feedback?.helpful ?? 0} helpful`}
            accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
            loading={loading}
            isPercentage
            trend={
              !loading && (stats?.feedback?.satisfactionRate ?? 0) >= 80
                ? "high"
                : undefined
            }
          />
        </div>

        {/* Recent conversations */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent conversations</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/assistant">
                Open assistant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card className="mt-3 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-md bg-muted"
                    />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Sparkles className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">No conversations yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start a new chat to see it appear here.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/assistant">
                      <Plus className="h-4 w-4" />
                      Start a conversation
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((c, i) => {
                    const badge = badgeForType(c.requestType);
                    return (
                      <motion.li
                        key={c.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: i * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={`/assistant?c=${c.id}`}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                        >
                          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            {/* status dot */}
                            <span
                              className={cn(
                                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                c.pinned
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              )}
                              title={c.pinned ? "Pinned" : "Active"}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {c.pinned && (
                                <Pin className="h-3 w-3 shrink-0 text-amber-500" />
                              )}
                              <p className="truncate text-sm font-medium">
                                {c.title}
                              </p>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {c._count.messages} message
                              {c._count.messages === 1 ? "" : "s"} ·{" "}
                              {formatRelative(c.updatedAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "hidden shrink-0 text-[10px] capitalize sm:inline-flex",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
