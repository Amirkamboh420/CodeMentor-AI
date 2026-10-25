"use client";

import { Sparkles, Wand2, Brain, Bug } from "lucide-react";
import { useAssistantStore, type RequestType } from "@/store/assistant-store";
import { cn } from "@/lib/utils";

const TABS: {
  id: RequestType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  active: string;
}[] = [
  {
    id: "generate",
    label: "Generate",
    icon: Sparkles,
    hint: "Create new code from a spec",
    active:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: Wand2,
    hint: "Improve existing code",
    active:
      "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/40",
  },
  {
    id: "explain",
    label: "Explain",
    icon: Brain,
    hint: "Break down how code works",
    active:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  },
  {
    id: "debug",
    label: "Debug",
    icon: Bug,
    hint: "Find and fix issues",
    active: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40",
  },
];

export function RequestTypeTabs() {
  const requestType = useAssistantStore((s) => s.requestType);
  const setRequestType = useAssistantStore((s) => s.setRequestType);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = requestType === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRequestType(tab.id)}
            className={cn(
              "group flex flex-col items-start gap-1 rounded-lg border bg-card p-2.5 text-left transition-all hover:shadow-sm",
              isActive
                ? tab.active
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
            aria-pressed={isActive}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground/80">
              {tab.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
