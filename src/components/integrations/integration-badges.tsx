"use client";

import * as React from "react";
import {
  Github,
  Rocket,
  Cloud,
  Check,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type IntegrationKind = "github" | "vercel" | "neno";

export interface IntegrationStatuses {
  github?: boolean;
  vercel?: boolean;
  neno?: boolean;
}

interface IntegrationMeta {
  key: IntegrationKind;
  label: string;
  icon: LucideIcon;
}

const INTEGRATIONS: IntegrationMeta[] = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "vercel", label: "Vercel", icon: Rocket },
  { key: "neno", label: "Neno", icon: Cloud },
];

interface IntegrationBadgesProps {
  statuses: IntegrationStatuses;
  /** Compact = pill-only, good for project cards. Default = with label. */
  compact?: boolean;
  className?: string;
}

/**
 * Small status badges for the three third-party integrations.
 * Used in the project card and the workspace header.
 *
 * connected  = emerald with check icon
 * disconnected = muted with hollow dot
 */
export function IntegrationBadges({
  statuses,
  compact = false,
  className,
}: IntegrationBadgesProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {INTEGRATIONS.map((meta) => {
        const connected = !!statuses[meta.key];
        const Icon = meta.icon;
        return (
          <Badge
            key={meta.key}
            variant="outline"
            className={cn(
              "gap-1 px-2 py-0.5 text-[10px] font-medium transition-colors",
              connected
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-muted/40 text-muted-foreground",
              compact && "px-1.5"
            )}
            title={
              connected
                ? `${meta.label} connected`
                : `${meta.label} not connected`
            }
          >
            <Icon className="h-3 w-3" />
            {!compact && <span>{meta.label}</span>}
            {connected ? (
              <Check className="h-3 w-3" />
            ) : (
              <CircleDot className="h-3 w-3 opacity-50" />
            )}
          </Badge>
        );
      })}
    </div>
  );
}

/** A single integration badge (for inline use). */
export function IntegrationBadge({
  kind,
  connected,
  label = true,
}: {
  kind: IntegrationKind;
  connected: boolean;
  label?: boolean;
}) {
  const meta = INTEGRATIONS.find((m) => m.key === kind)!;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[10px] font-medium transition-colors",
        connected
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {label && <span>{meta.label}</span>}
      {connected ? (
        <Check className="h-3 w-3" />
      ) : (
        <CircleDot className="h-3 w-3 opacity-50" />
      )}
    </Badge>
  );
}
