"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Shield,
  Check,
  AlertCircle,
  Calendar,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function roleBadgeClass(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "ADMIN":
      return "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function roleLabel(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    default:
      return "Member";
  }
}

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const user = session?.user;
  const [name, setName] = React.useState(user?.name || "");

  React.useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const onProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Profile update coming soon", {
      description: "This feature is under active development.",
    });
  };

  const onPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Password change coming soon", {
      description: "This feature is under active development.",
    });
  };

  const onSignOutAll = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security, and preferences.
          </p>
        </div>

        <Separator className="my-6" />

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account information and verification status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">{user?.name || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 gap-1 text-[10px]",
                      roleBadgeClass(user?.role)
                    )}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {roleLabel(user?.role)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Email verification
                </Label>
                <div>
                  {user?.emailVerified ? (
                    <Badge
                      variant="outline"
                      className="h-5 gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <Check className="h-2.5 w-2.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-5 gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      <AlertCircle className="h-2.5 w-2.5" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Member since
                </Label>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">—</span>
                </div>
              </div>
            </div>

            <Separator />

            <form onSubmit={onProfileSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <Button type="submit" size="sm">
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
            <CardDescription>
              Update your password and manage active sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onPasswordSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new">New password</Label>
                  <Input
                    id="new"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" size="sm">
                Update password
              </Button>
            </form>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Sign out of all devices</p>
                <p className="text-xs text-muted-foreground">
                  End your session everywhere you&apos;re logged in.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onSignOutAll}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how CodeMentor AI looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((t) => {
                const active = mounted && theme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <t.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
