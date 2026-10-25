"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssistantStore, type ChatMessage } from "@/store/assistant-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RequestTypeTabs } from "@/components/assistant/request-type-tabs";
import { ContextBar } from "@/components/assistant/context-bar";
import { CodeEditor } from "@/components/assistant/code-editor";
import { PromptInput } from "@/components/assistant/prompt-input";
import { ResponsePanel } from "@/components/assistant/response-panel";
import { HistorySidebar } from "@/components/assistant/history-sidebar";
import { SnippetsLibrary } from "@/components/assistant/snippets-library";
import { ShortcutsDialog } from "@/components/assistant/shortcuts-dialog";
import { CommandPalette } from "@/components/assistant/command-palette";
import { PresetsManager } from "@/components/assistant/presets-manager";
import { DiffViewLauncher } from "@/components/assistant/diff-view-launcher";
import { ShareDialog } from "@/components/assistant/share-dialog";
import { ImportDialog } from "@/components/assistant/import-dialog";
import { KnowledgePanel } from "@/components/kb/knowledge-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Brain, Code2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function AssistantWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kbOpen = useAssistantStore((s) => s.kbOpen);
  const setKbOpen = useAssistantStore((s) => s.setKbOpen);
  const setMessages = useAssistantStore((s) => s.setMessages);
  const setConversationId = useAssistantStore((s) => s.setConversationId);
  const conversationId = useAssistantStore((s) => s.conversationId);

  // Wire up global keyboard shortcuts (⌘P, ⌘S, ⌘L, ⌘K, ?, Esc, etc.)
  useKeyboardShortcuts();

  // Track the conversation id loaded from the URL so we don't refetch on
  // every render. The `c` query param is read once per navigation.
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    const c = searchParams.get("c");
    if (!c) {
      // No conversation requested — clear the loaded id so a future ?c=
      // navigation will trigger a fresh fetch.
      loadedRef.current = null;
      return;
    }
    // Skip if already loaded (or in-progress)
    if (loadedRef.current === c) return;
    loadedRef.current = c;

    // If the user already has this conversation open, do nothing.
    if (conversationId === c) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${c}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Conversation not found");
          } else if (res.status === 403) {
            toast.error("You don't have access to this conversation");
          } else if (res.status === 401) {
            // Session expired — bounce to login.
            toast.error("Please sign in to continue");
            router.replace(
              `/login?callbackUrl=${encodeURIComponent(`/assistant?c=${c}`)}`
            );
            return;
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const conv = data.conversation;
        if (!conv) return;
        // Map DB messages → ChatMessage (same mapping as the history sidebar
        // so the historical diff works for reopened conversations).
        const msgs: ChatMessage[] = (conv.messages || []).map(
          (m: {
            id: string;
            role: string;
            content: string;
            requestType: string | null;
            prompt: string | null;
            code: string | null;
            feedback: string | null;
            createdAt: string;
          }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            requestType: (m.requestType as ChatMessage["requestType"]) || undefined,
            prompt: m.prompt || undefined,
            code: m.code || undefined,
            feedback: (m.feedback as ChatMessage["feedback"]) || undefined,
            createdAt: new Date(m.createdAt).getTime(),
          })
        );
        setMessages(msgs);
        setConversationId(conv.id);
      } catch {
        if (!cancelled) toast.error("Failed to load conversation");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, conversationId, setMessages, setConversationId, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {/* Overlay dialogs (history sidebar, command palette, snippets, etc.)
          — each component reads its own open state from the store. */}
      <HistorySidebar />
      <SnippetsLibrary />
      <ShortcutsDialog />
      <CommandPalette />
      <PresetsManager />
      <DiffViewLauncher />
      <ShareDialog />
      <ImportDialog />

      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Center column: the assistant workspace */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Composer (top): request type + context + code editor + prompt */}
          <div className="border-b border-border bg-muted/20">
            <div className="mx-auto w-full max-w-4xl space-y-3 p-3 sm:p-4">
              <RequestTypeTabs />
              <ContextBar />
              <div className="h-[180px] sm:h-[200px]">
                <CodeEditor />
              </div>
              <PromptInput />
            </div>
          </div>

          {/* Conversation thread (bottom) */}
          <div className="min-h-0 flex-1 bg-background">
            <ScrollArea className="h-full">
              <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4">
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Conversation
                  </span>
                  <Separator className="flex-1" />
                </div>
                <ResponsePanel />
              </div>
            </ScrollArea>
          </div>
        </section>

        {/* Right column: knowledge base (lg+ only — togglable) */}
        <aside
          className={cn(
            "relative hidden shrink-0 flex-col border-l border-border bg-card lg:flex",
            kbOpen ? "w-[340px] xl:w-[380px]" : "w-0 overflow-hidden border-l-0"
          )}
        >
          <div className="flex h-12 items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold">Knowledge Base</span>
            </div>
            <Badge variant="secondary" className="text-[9px]">
              Reference
            </Badge>
          </div>
          <div className="min-h-0 flex-1">
            <KnowledgePanel />
          </div>
        </aside>

        {/* Floating mobile KB toggle button (visible only on small screens
            when the KB panel is closed — the panel itself is hidden on
            mobile, so this is the only way for mobile users to reach it). */}
        {!kbOpen && (
          <button
            onClick={() => setKbOpen(true)}
            className="fixed bottom-16 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
            aria-label="Open knowledge base"
          >
            <Code2 className="h-5 w-5" />
          </button>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function AssistantPage() {
  // Wrap in <Suspense> so useSearchParams() can be used without
  // de-opting the whole route to client-side rendering.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex h-8 w-8 items-center justify-center">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </div>
      }
    >
      <AssistantWorkspace />
    </Suspense>
  );
}
