"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, ArrowLeft, Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "@/components/assistant/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/components/theme-provider";
import { readShareFromHash, type ShareableConversation } from "@/lib/share-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ShareContent() {
  // Read the hash once on mount. Using a lazy initializer avoids the
  // setState-in-effect lint warning and is safe because this is a
  // client component.
  const [conv] = useState<ShareableConversation | null>(() =>
    readShareFromHash()
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!conv) return;
    const text = conv.messages
      .map((m) => `**${m.role === "user" ? "You" : "CodeMentor AI"}:**\n${m.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Conversation copied");
  };

  if (!conv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h1 className="text-lg font-semibold">Invalid share link</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This share link is malformed or empty. Please check the URL and try
          again.
        </p>
        <Button asChild className="mt-2">
          <a href="/">
            <ArrowLeft className="h-4 w-4" /> Back to CodeMentor AI
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{conv.title}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Badge variant="secondary" className="h-3.5 px-1 text-[8px] uppercase">
                  {conv.requestType || "generate"}
                </Badge>
                Shared conversation · {conv.messages.length} messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
            <Button size="sm" asChild className="h-8 gap-1 text-xs">
              <a href="/">
                <ArrowLeft className="h-3.5 w-3.5" /> Open CodeMentor
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Read-only banner */}
      <div className="border-b border-amber-500/30 bg-amber-500/5 px-4 py-1.5 text-center text-[10px] text-amber-700 dark:text-amber-300">
        🔒 Read-only shared view — this conversation is frozen in time
      </div>

      {/* Messages */}
      <main className="flex-1">
        <ScrollArea className="h-[calc(100vh-7rem)]">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
            {conv.messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex w-full gap-3",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                      isUser
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    <span className="text-xs font-bold">
                      {isUser ? "You" : "AI"}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex min-w-0 max-w-[calc(100%-2.75rem)] flex-col",
                      isUser ? "items-end" : "items-start"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {isUser ? "You" : "CodeMentor AI"}
                      </span>
                      {m.requestType && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                          {m.requestType}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 shadow-sm",
                        isUser
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card"
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                          {m.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

export default function SharePage() {
  return (
    <ThemeProvider>
      <ShareContent />
    </ThemeProvider>
  );
}
