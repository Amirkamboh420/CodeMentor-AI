"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || "Failed to send reset link.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Reset link generated");
      // Dev convenience: API returns the reset token directly.
      if (data?.resetToken) {
        setResetToken(data.resetToken as string);
      } else {
        // Production path: show generic "check your email" success state.
        setResetToken("__sent__");
      }
    } catch (err) {
      console.error("[forgot-password] error:", err);
      const msg = "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!resetToken || resetToken === "__sent__") return;
    try {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Token copied");
    } catch {
      toast.error("Could not copy token");
    }
  }

  // ---- Success state ----------------------------------------------------
  if (resetToken) {
    const sentEmail = resetToken === "__sent__";
    return (
      <AuthShell
        title="Check your email"
        description={
          sentEmail
            ? "If an account exists for that email, a reset link is on its way."
            : "Use the reset token below to set a new password."
        }
        footer={
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          {!sentEmail ? (
            <div className="w-full space-y-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  <Mail className="h-3.5 w-3.5" />
                  Your reset token
                </p>
                <code className="block w-full break-all rounded-md bg-background/60 px-3 py-2 text-center font-mono text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {resetToken}
                </code>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1"
                  onClick={copyToken}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy token"}
                </Button>
                <Button
                  type="button"
                  asChild
                  className="h-10 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  >
                    Reset password
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                In production this token would be emailed to you. It expires in
                1 hour.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. The link
              expires in 1 hour.
            </p>
          )}
        </div>
      </AuthShell>
    );
  }

  // ---- Form state -------------------------------------------------------
  return (
    <AuthShell
      title="Forgot password?"
      description="Enter your email and we'll generate a password reset link."
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
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 w-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
