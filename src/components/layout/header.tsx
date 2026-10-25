"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  History,
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
  BarChart3,
  Loader2,
  Github,
  MessageSquareText,
  CheckCircle2,
  FileCode2,
  Keyboard,
  Command,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAssistantStore } from "@/store/assistant-store";
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

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const setHistoryOpen = useAssistantStore((s) => s.setHistoryOpen);
  const historyOpen = useAssistantStore((s) => s.historyOpen);
  const kbOpen = useAssistantStore((s) => s.kbOpen);
  const setKbOpen = useAssistantStore((s) => s.setKbOpen);
  const setSnippetsOpen = useAssistantStore((s) => s.setSnippetsOpen);
  const setShortcutsOpen = useAssistantStore((s) => s.setShortcutsOpen);
  const setPaletteOpen = useAssistantStore((s) => s.setPaletteOpen);
  const setPresetsOpen = useAssistantStore((s) => s.setPresetsOpen);
  const isStreaming = useAssistantStore((s) => s.isStreaming);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [snippetCount, setSnippetCount] = useState(0);
  const [presetCount, setPresetCount] = useState(0);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
      setSnippetCount(data.snippets || 0);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPresetCount = async () => {
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      setPresetCount((data.prompts || []).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPresetCount();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-label="Toggle history"
        >
          <History className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={32} height={32} />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold leading-tight">
              CodeMentor AI
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              Expert code assistant
            </span>
          </div>
        </div>

        {isStreaming && (
          <Badge
            variant="outline"
            className="ml-2 gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </Badge>
        )}

        {/* Command palette trigger */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
                aria-label="Open command palette"
              >
                <Command className="h-3.5 w-3.5" />
                <span>Command</span>
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[9px]">
                  ⌘P
                </kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent>Command palette (⌘P)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Presets manager trigger */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => setPresetsOpen(true)}
                aria-label="Prompt presets"
              >
                <Bookmark className="h-4 w-4" />
                {presetCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[8px] font-bold text-white">
                    {presetCount > 99 ? "99+" : presetCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Prompt presets</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-1">
        <Popover onOpenChange={(o) => o && loadStats()}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Stats">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-semibold">Usage Stats</p>
              <p className="text-[10px] text-muted-foreground">
                Aggregated across all conversations
              </p>
            </div>
            {loadingStats || !stats ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Chats" value={stats.conversations} />
                  <Stat label="Messages" value={stats.messages} />
                  <Stat label="Snippets" value={stats.snippets} />
                </div>
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-semibold text-emerald-600">
                      {stats.feedback.satisfactionRate}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${stats.feedback.satisfactionRate}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
                    <span>👍 {stats.feedback.helpful}</span>
                    <span>😐 {stats.feedback.partial}</span>
                    <span>👎 {stats.feedback.no}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    By request type
                  </p>
                  <div className="space-y-1">
                    {stats.byRequestType.map((r) => (
                      <div
                        key={r.type}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="flex items-center gap-1.5 capitalize">
                          <MessageSquareText className="h-2.5 w-2.5 text-muted-foreground" />
                          {r.type}
                        </span>
                        <span className="font-mono">{r.count}</span>
                      </div>
                    ))}
                    {stats.byRequestType.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        No requests yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Code worked
                  </span>
                  <span className="font-mono">
                    {stats.feedback.codeWorked}/{stats.feedback.total}
                  </span>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 sm:inline-flex"
          asChild
        >
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Docs"
          >
            <Github className="h-4 w-4" />
          </a>
        </Button>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => setSnippetsOpen(true)}
                aria-label="Snippets library"
              >
                <FileCode2 className="h-4 w-4" />
                {snippetCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[8px] font-bold text-white">
                    {snippetCount > 99 ? "99+" : snippetCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snippets (⌘S)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 sm:inline-flex"
                onClick={() => setShortcutsOpen(true)}
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shortcuts (?)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", kbOpen && "bg-accent")}
          onClick={() => setKbOpen(!kbOpen)}
          aria-label="Toggle knowledge base"
        >
          {kbOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-2 text-center">
      <p className="text-base font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
