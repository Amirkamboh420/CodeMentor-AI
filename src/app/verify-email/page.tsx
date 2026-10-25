"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";

type Status = "idle" | "verifying" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [status, setStatus] = useState<Status>(
    tokenFromUrl ? "verifying" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const didAutoVerify = useRef(false);

  // Auto-verify if a token is in the URL.
  useEffect(() => {
    if (!tokenFromUrl || didAutoVerify.current) return;
    didAutoVerify.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(
            data?.error || "Invalid or expired verification token."
          );
          return;
        }

        setStatus("success");
        toast.success("Email verified successfully");
        setTimeout(() => router.push("/login"), 1500);
      } catch (err) {
        console.error("[verify-email] error:", err);
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl, router]);

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setStatus("verifying");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manualToken.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(
          data?.error || "Invalid or expired verification token."
        );
        return;
      }

      setStatus("success");
      toast.success("Email verified successfully");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("[verify-email] error:", err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  // ---- Success state ----------------------------------------------------
  if (status === "success") {
    return (
      <AuthShell
        title="Email verified"
        description="Your email address has been confirmed successfully."
        footer={
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Continue to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting you to sign in…
          </p>
          <Button
            type="button"
            asChild
            className="h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Link href="/login">
              Continue to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  // ---- Verifying state (auto from URL) ----------------------------------
  if (status === "verifying" && tokenFromUrl) {
    return (
      <AuthShell
        title="Verifying your email"
        description="Please wait while we confirm your email address."
        hideHomeLink
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
              <MailCheck className="h-7 w-7" />
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </p>
        </div>
      </AuthShell>
    );
  }

  // ---- Error / manual entry state ---------------------------------------
  return (
    <AuthShell
      title="Verify your email"
      description={
        status === "error" && tokenFromUrl
          ? "The verification link didn't work. Paste your token below to try again."
          : "Enter the verification token sent to your email to activate your account."
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
      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      <form
        onSubmit={handleManualSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        {status === "error" && errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="manualToken">Verification token</Label>
          <Input
            id="manualToken"
            name="token"
            type="text"
            autoComplete="off"
            placeholder="Paste your verification token"
            value={manualToken}
            onChange={(e) => {
              setManualToken(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">
            Tip: after signing up, the token is shown in the URL or can be
            requested from your account page.
          </p>
        </div>

        <Button
          type="submit"
          disabled={status === "verifying" || !manualToken.trim()}
          className="mt-2 h-10 w-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
        >
          {status === "verifying" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Verify email
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
