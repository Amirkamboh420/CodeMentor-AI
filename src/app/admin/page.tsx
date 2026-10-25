"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  MessageSquare,
  FileCode2,
  ThumbsUp,
  Hash,
  Shield,
  ShieldAlert,
  Pin,
  ArrowRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleBadgeClass, roleLabel } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

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
  pinned: boolean;
  _count: { messages: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function LoadingScreen() {
  return (
    <AppLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    </AppLayout>
  );
}

function AccessDenied() {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
          <ShieldAlert className="h-7 w-7 text-rose-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have permission to view the admin dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </AppLayout>
  );
}

type IconType = React.ComponentType<{ className?: string }>;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  // Redirect non-admins away (middleware also enforces this server-side).
  React.useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  // Load platform stats + conversations only when admin.
  React.useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
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
        // ignore
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, isAdmin]);

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const statCards: {
    icon: IconType;
    label: string;
    value: React.ReactNode;
    accent: string;
  }[] = [
    {
      icon: MessageSquare,
      label: "Conversations",
      value: stats?.conversations ?? 0,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Hash,
      label: "Messages",
      value: stats?.messages ?? 0,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      icon: FileCode2,
      label: "Snippets",
      value: stats?.snippets ?? 0,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      icon: ThumbsUp,
      label: "Satisfaction",
      value: `${stats?.feedback?.satisfactionRate ?? 0}%`,
      accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  // Placeholder user row for the current admin (user management API pending).
  const mockUsers = session?.user
    ? [
        {
          id: session.user.id || "self",
          name: session.user.name || "You",
          email: session.user.email || "—",
          role: session.user.role || "USER",
          emailVerified: !!session.user.emailVerified,
        },
      ]
    : [];

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin
            </h1>
          </div>
          <Badge
            variant="outline"
            className={cn("w-fit", roleBadgeClass(role))}
          >
            {roleLabel(role)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide stats and user management.
        </p>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      s.accent
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" />
                  ) : (
                    s.value
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </CardTitle>
            <CardDescription>
              Manage user accounts and roles. Full user management is coming
              soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(roleBadgeClass(u.role))}
                      >
                        {roleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.emailVerified ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      Active
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* All conversations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              All conversations
            </CardTitle>
            <CardDescription>
              Recent activity across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <div className="h-5 animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : conversations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No conversations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.slice(0, 20).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {c.pinned && (
                            <Pin className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="max-w-[240px] truncate">
                            {c.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="capitalize"
                        >
                          {c.requestType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c._count.messages}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/assistant?c=${c.id}`}>
                            Open
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
