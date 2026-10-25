"use client";

import { ShieldCheck, Zap, BookOpen, Heart } from "lucide-react";
import { useAssistantStore } from "@/store/assistant-store";

export function Footer() {
  const messages = useAssistantStore((s) => s.messages);
  const isStreaming = useAssistantStore((s) => s.isStreaming);

  return (
    <footer className="mt-auto border-t border-border bg-background/80 px-3 py-2 backdrop-blur-md sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Security-first
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Zap className="h-3 w-3 text-amber-500" />
            Streaming
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <BookOpen className="h-3 w-3 text-violet-500" />
            Knowledge base
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono">
            {messages.length} msg{messages.length === 1 ? "" : "s"}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {isStreaming ? "Generating..." : "Ready"}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" /> on Z.ai
          </span>
        </div>
      </div>
    </footer>
  );
}
