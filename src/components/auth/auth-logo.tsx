"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthLogoProps {
  /** Size of the logo square in pixels. */
  size?: number;
  /** Optional extra classes on the root wrapper. */
  className?: string;
  /** Show the wordmark next to the logo. */
  showWordmark?: boolean;
}

/**
 * CodeMentor AI brand logo used at the top of every auth page card.
 */
export function AuthLogo({
  size = 48,
  className,
  showWordmark = false,
}: AuthLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className="rounded-2xl shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/30"
      />
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">
            CodeMentor AI
          </span>
          <span className="text-[11px] text-muted-foreground">
            Expert code assistant
          </span>
        </div>
      )}
    </div>
  );
}
