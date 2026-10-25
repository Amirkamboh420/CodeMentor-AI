"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthLogo } from "./auth-logo";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  /** Card title (e.g. "Welcome back"). */
  title: string;
  /** Card subtitle / description. */
  description?: string;
  /** Auth form contents. */
  children: ReactNode;
  /** Optional footer node (links, hints). */
  footer?: ReactNode;
  /** Extra classes on the card root. */
  className?: string;
  /** Hide the default "Back to home" link in the top-left of the screen. */
  hideHomeLink?: boolean;
}

/**
 * Lightweight floating particles — pure CSS, no JS animation loop.
 * Renders 12 absolutely-positioned dots with staggered keyframe delays.
 * They animate via the `float` keyframe (defined in globals.css), keeping
 * the work on the compositor (transform/opacity only).
 */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 5) % 100}%`,
  top: `${(i * 11.7 + 8) % 100}%`,
  size: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3,
  delay: `${(i * 0.7) % 5}s`,
  duration: `${4 + (i % 5)}s`,
  opacity: i % 2 === 0 ? 0.45 : 0.25,
}));

/**
 * Shared centered-card layout for all auth pages.
 *
 * - Full-screen centered card on a subtle emerald gradient background.
 * - Floating particles + grid for a premium, dynamic feel.
 * - Card has a gradient border (via wrapper) + soft glow.
 * - Responsive: full-width on mobile, fixed max-width on desktop.
 * - Dark-mode aware (uses bg-card / bg-background tokens).
 * - Includes the CodeMentor AI logo at the top of every card.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
  hideHomeLink = false,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Subtle emerald radial + grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 60rem at 50% -10%, rgba(16,185,129,0.14), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
      />

      {/* Floating particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-emerald-500/40 animate-float"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Top-left back-to-home link */}
      {!hideHomeLink && (
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      )}

      {/* Brand mark — clickable to home */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-label="CodeMentor AI home"
      >
        <AuthLogo size={44} showWordmark />
      </Link>

      {/* Card with gradient border + glow */}
      <div className="group/card relative w-full max-w-md sm:max-w-md">
        {/* Glow behind card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent opacity-70 blur-xl"
        />
        {/* Gradient border wrapper */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent p-px"
        >
          <div className="h-full w-full rounded-2xl bg-card" />
        </div>

        <Card
          className={cn(
            "relative w-full border-transparent bg-card shadow-[var(--shadow-glow)] sm:max-w-md",
            className
          )}
        >
          <CardContent className="flex flex-col gap-6 px-6 py-8 sm:px-8">
            {/* Inline mini logo + title block */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 animate-pulse-glow rounded-2xl"
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30 transition-transform duration-300 hover:scale-105">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-sm text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
        © {new Date().getFullYear()} CodeMentor AI · Security-first AI code assistant
      </p>
    </div>
  );
}
