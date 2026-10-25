"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { MessageBubble } from "./message-bubble";
import {
  Sparkles,
  BookOpen,
  FileDown,
  Trash2,
  Keyboard,
  ArrowRight,
  Share2,
  FileJson,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistantStore, type ChatMessage } from "@/store/assistant-store";
import { useAssistantActions } from "@/hooks/use-assistant-actions";
import { toast } from "sonner";
import { messagesToMarkdown, downloadText, countStats } from "@/lib/conversation-utils";
import { downloadJson, type ExportableConversation } from "@/lib/json-export";

const EXAMPLE_PROMPTS: { type: string; icon: string; title: string; hint: string }[] = [
  { type: "Generate", icon: "✨", title: "Debounce hook", hint: "with cleanup + cancel" },
  { type: "Refactor", icon: "🪄", title: "Optimize re-renders", hint: "useCallback + memo" },
  { type: "Explain", icon: "🧠", title: "useReducer flow", hint: "step-by-step" },
  { type: "Debug", icon: "🐞", title: "Async race condition", hint: "AbortController fix" },
];

export function ResponsePanel() {
  const messages = useAssistantStore((s) => s.messages);
  const isStreaming = useAssistantStore((s) => s.isStreaming);
  const streamingError = useAssistantStore((s) => s.streamingError);
  const setMessages = useAssistantStore((s) => s.setMessages);
  const clearConversation = useAssistantStore((s) => s.clearConversation);
  const setShortcutsOpen = useAssistantStore((s) => s.setShortcutsOpen);
  const setPrompt = useAssistantStore((s) => s.setPrompt);
  const setShareOpen = useAssistantStore((s) => s.setShareOpen);
  const setImportOpen = useAssistantStore((s) => s.setImportOpen);
  const requestType = useAssistantStore((s) => s.requestType);
  const techStack = useAssistantStore((s) => s.techStack);
  const developerLevel = useAssistantStore((s) => s.developerLevel);
  const { regenerate: handleRegenerate } = useAssistantActions();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  const handleFeedback = useCallback(
    async (msg: ChatMessage, helpful: "yes" | "partial" | "no") => {
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: msg.id,
            helpful,
            usedCode: true,
          }),
        });
        setMessages(
          messages.map((m) =>
            m.id === msg.id ? { ...m, feedback: helpful } : m
          )
        );
        toast.success("Thanks for the feedback!");
      } catch {
        toast.error("Failed to submit feedback");
      }
    },
    [messages, setMessages]
  );

  const handleExportAll = useCallback(() => {
    if (messages.length === 0) return;
    const md = messagesToMarkdown(messages, "CodeMentor AI Conversation");
    downloadText(
      `codementor-conversation-${Date.now()}.md`,
      md,
      "text/markdown"
    );
    toast.success("Conversation exported");
  }, [messages]);

  const handleExportJson = useCallback(() => {
    if (messages.length === 0) return;
    const title =
      (messages[0]?.role === "user"
        ? messages[0].content.slice(0, 60)
        : "Conversation") || "Conversation";
    const exportable: ExportableConversation = {
      version: 1,
      title,
      requestType,
      techStack: Array.isArray(techStack) ? techStack.join(", ") : "",
      developerLevel,
      pinned: false,
      tags: "",
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        requestType: m.requestType,
        prompt: m.prompt,
        code: m.code,
        feedback: m.feedback,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
    };
    downloadJson(`codementor-${Date.now()}.json`, exportable);
    toast.success("Conversation exported as JSON");
  }, [messages, requestType, techStack, developerLevel]);

  // Aggregate stats for the conversation
  const convStats = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant" && m.content);
    const total = assistantMsgs.reduce((sum, m) => sum + countStats(m.content).tokens, 0);
    const words = assistantMsgs.reduce((sum, m) => sum + countStats(m.content).words, 0);
    return { tokens: total, words, assistantCount: assistantMsgs.length };
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        {/* Hero */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-emerald-500/20 blur-2xl" />
          <div className="relative flex h-16 w-16 animate-float items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 shadow-lg">
            <Sparkles className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">
            Ready to assist
          </h3>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Describe what you need below. I&apos;ll generate production-ready
            code, refactor existing snippets, explain tricky logic, or debug
            failures — adapting to your stack and skill level.
          </p>
        </div>

        {/* Example prompt cards */}
        <div className="grid w-full max-w-lg grid-cols-2 gap-2 text-left sm:grid-cols-4">
          {EXAMPLE_PROMPTS.map((c) => (
            <button
              key={c.title}
              onClick={() => setPrompt(`${c.type}: `)}
              className="group rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-emerald-500/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{c.icon}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-[11px] font-medium">{c.title}</p>
              <p className="text-[9px] text-muted-foreground">{c.hint}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Knowledge panel on the right
          </span>
          <span className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">
              ?
            </kbd>{" "}
            for shortcuts
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      {/* Conversation toolbar */}
      <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-2 py-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-medium">{messages.length} messages</span>
          <span>·</span>
          <span>~{convStats.tokens} tokens</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{convStats.words} words</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-3 w-3" /> Share
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground"
            onClick={handleExportAll}
          >
            <FileDown className="h-3 w-3" /> MD
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground"
            onClick={handleExportJson}
          >
            <FileJson className="h-3 w-3" /> JSON
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-3 w-3" /> Import
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={clearConversation}
          >
            <Trash2 className="h-3 w-3" /> Clear
          </Button>
        </div>
      </div>

      {messages.map((m, i) => (
        <MessageBubble
          key={m.id}
          message={m}
          index={i}
          totalMessages={messages.length}
          onFeedback={handleFeedback}
          onRegenerate={handleRegenerate}
          isStreaming={isStreaming && i === messages.length - 1 && m.role === "assistant"}
          isLast={i === messages.length - 1}
        />
      ))}
      {streamingError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">
          ⚠️ {streamingError}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
