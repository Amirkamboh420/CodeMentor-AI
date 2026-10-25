"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    token?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});

  function validate() {
    const next: typeof errors = {};
    if (!token) next.token = "Reset token is required.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6)
      next.password = "Password must be at least 6 characters.";
    if (!confirm) next.confirm = "Please confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error || "Invalid or expired reset token. Please try again.";
        setErrors({ form: msg });
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Password reset successfully");
      // Small delay so the toast is visible before navigation.
      setTimeout(() => router.push("/login"), 600);
    } catch (err) {
      console.error("[reset-password] error:", err);
      const msg = "Something went wrong. Please try again.";
      setErrors({ form: msg });
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your CodeMentor AI account."
      footer={
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {errors.form && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Token — if it came from the URL, show as read-only summary */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="token">Reset token</Label>
          {tokenFromUrl ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                From link
              </p>
              <code className="block w-full break-all font-mono text-xs text-foreground/80">
                {tokenFromUrl}
              </code>
            </div>
          ) : (
            <input
              id="token"
              name="token"
              type="text"
              autoComplete="off"
              placeholder="Paste your reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-invalid={!!errors.token}
              className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
              required
            />
          )}
          {errors.token && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {errors.token}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((p) => ({ ...p, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            required
          />
          {errors.password ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {errors.password}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use at least 6 characters.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm)
                setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            aria-invalid={!!errors.confirm}
            required
          />
          {errors.confirm && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {errors.confirm}
            </p>
          )}
          {confirm && confirm === password && (
            <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 w-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
