"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Sparkles,
  Wand2,
  Brain,
  Bug,
  History,
  PanelRight,
  FileCode2,
  Sun,
  Moon,
  Keyboard,
  Plus,
  Send,
  RefreshCw,
  Trash2,
  FileDown,
  Bookmark,
  Search,
  CornerDownLeft,
  GitCompare,
  Share2,
  FileJson,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAssistantStore, type RequestType } from "@/store/assistant-store";
import { useAssistantActions } from "@/hooks/use-assistant-actions";
import { messagesToMarkdown, downloadText } from "@/lib/conversation-utils";
import { toast } from "sonner";

interface PromptPreset {
  id: string;
  title: string;
  prompt: string;
  requestType: string;
}

interface ActionItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useAssistantStore((s) => s.paletteOpen);
  const setOpen = useAssistantStore((s) => s.setPaletteOpen);
  const { setHistoryOpen, setKbOpen, kbOpen, setSnippetsOpen, setShortcutsOpen } =
    useAssistantStore();
  const { requestType, setRequestType, messages, clearConversation } =
    useAssistantStore();
  const { sendPrompt, regenerate, newConversation } = useAssistantActions();
  const { theme, setTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [presets, setPresets] = useState<PromptPreset[]>([]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSearch("");
      setOpen(next);
    },
    [setOpen]
  );

  // Load presets when palette opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((d) => setPresets(d.prompts || []))
      .catch(() => {});
  }, [open]);

  const handleExport = useCallback(() => {
    if (messages.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const md = messagesToMarkdown(messages, "CodeMentor AI Conversation");
    downloadText(
      `codementor-conversation-${Date.now()}.md`,
      md,
      "text/markdown"
    );
    toast.success("Conversation exported");
    close();
  }, [messages, close]);

  const requestTypes: {
    id: RequestType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "refactor", label: "Refactor", icon: Wand2 },
    { id: "explain", label: "Explain", icon: Brain },
    { id: "debug", label: "Debug", icon: Bug },
  ];

  const actions = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [
      {
        id: "send",
        label: "Send current prompt",
        icon: Send,
        group: "Conversation",
        keywords: "send submit generate",
        run: () => {
          sendPrompt();
          close();
        },
      },
      {
        id: "regenerate",
        label: "Regenerate last response",
        icon: RefreshCw,
        group: "Conversation",
        keywords: "regenerate retry redo",
        run: () => {
          regenerate();
          close();
        },
      },
      {
        id: "new",
        label: "New conversation",
        icon: Plus,
        group: "Conversation",
        keywords: "new clear fresh",
        run: () => {
          newConversation();
          close();
        },
      },
      {
        id: "export",
        label: "Export conversation to Markdown",
        icon: FileDown,
        group: "Conversation",
        keywords: "export download markdown save",
        run: handleExport,
      },
      {
        id: "share",
        label: "Share conversation (read-only link)",
        icon: Share2,
        group: "Conversation",
        keywords: "share link url copy read-only",
        run: () => {
          const state = useAssistantStore.getState();
          if (state.messages.length === 0) {
            toast.error("No conversation to share");
            return;
          }
          state.setShareOpen(true);
          close();
        },
      },
      {
        id: "export-json",
        label: "Export conversation to JSON (backup)",
        icon: FileJson,
        group: "Conversation",
        keywords: "export json backup download save",
        run: () => {
          const state = useAssistantStore.getState();
          if (state.messages.length === 0) {
            toast.error("No conversation to export");
            return;
          }
          state.setPaletteOpen(false);
          // Trigger the JSON export by simulating the toolbar action
          // via a custom event the response panel could listen to —
          // simplest: directly build + download here.
          import("@/lib/json-export").then(({ downloadJson }) => {
            const msgs = state.messages;
            const title =
              (msgs[0]?.role === "user"
                ? msgs[0].content.slice(0, 60)
                : "Conversation") || "Conversation";
            downloadJson(`codementor-${Date.now()}.json`, {
              version: 1,
              title,
              requestType: state.requestType,
              techStack: state.techStack.join(", "),
              developerLevel: state.developerLevel,
              pinned: false,
              tags: "",
              exportedAt: new Date().toISOString(),
              messages: msgs.map((m) => ({
                role: m.role,
                content: m.content,
                requestType: m.requestType,
                prompt: m.prompt,
                code: m.code,
                feedback: m.feedback,
                createdAt: new Date(m.createdAt).toISOString(),
              })),
            });
            toast.success("Conversation exported as JSON");
          });
        },
      },
      {
        id: "import-json",
        label: "Import conversation from JSON",
        icon: Upload,
        group: "Conversation",
        keywords: "import json restore backup upload file",
        run: () => {
          useAssistantStore.getState().setImportOpen(true);
          close();
        },
      },
      {
        id: "history",
        label: "Open history",
        icon: History,
        group: "Conversation",
        keywords: "history past conversations list",
        run: () => {
          setHistoryOpen(true);
          close();
        },
      },
      {
        id: "diff",
        label: "View code diff (original vs refactored)",
        icon: GitCompare,
        group: "Conversation",
        keywords: "diff compare refactor original changes",
        run: () => {
          // Target the last assistant message that has code
          const state = useAssistantStore.getState();
          const lastAssistant = [...state.messages]
            .reverse()
            .find((m) => m.role === "assistant" && m.content);
          if (!lastAssistant) {
            toast.error("No assistant response to diff");
            return;
          }
          if (!state.selectedCode.trim()) {
            toast.error("Add original code to the editor first");
            return;
          }
          state.setDiffMessageId(lastAssistant.id);
          close();
        },
      },
      {
        id: "clear",
        label: "Clear conversation",
        icon: Trash2,
        group: "Conversation",
        keywords: "delete remove reset",
        run: () => {
          clearConversation();
          close();
        },
      },
    ];

    // Request type switchers
    for (const rt of requestTypes) {
      list.push({
        id: `type-${rt.id}`,
        label: `Switch to ${rt.label}`,
        icon: rt.icon,
        group: "Request Type",
        keywords: `mode ${rt.id} ${rt.label}`,
        run: () => {
          setRequestType(rt.id);
          toast.success(`Mode: ${rt.label}`);
          close();
        },
      });
    }

    // Panel toggles
    list.push({
      id: "kb",
      label: kbOpen ? "Hide knowledge base" : "Show knowledge base",
      icon: PanelRight,
      group: "Panels",
      keywords: "knowledge reference panel sidebar",
      run: () => {
        setKbOpen(!kbOpen);
        close();
      },
    });
    list.push({
      id: "snippets",
      label: "Open snippets library",
      icon: FileCode2,
      group: "Panels",
      keywords: "snippets code saved",
      run: () => {
        setSnippetsOpen(true);
        close();
      },
    });
    list.push({
      id: "presets",
      label: "Manage prompt presets",
      icon: Bookmark,
      group: "Panels",
      keywords: "presets prompts saved manage",
      run: () => {
        useAssistantStore.getState().setPresetsOpen(true);
        close();
      },
    });
    list.push({
      id: "shortcuts",
      label: "Show keyboard shortcuts",
      icon: Keyboard,
      group: "Panels",
      keywords: "help shortcuts keys",
      run: () => {
        setShortcutsOpen(true);
        close();
      },
    });

    // Theme
    list.push({
      id: "theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      icon: theme === "dark" ? Sun : Moon,
      group: "Interface",
      keywords: "theme dark light mode",
      run: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        close();
      },
    });

    return list;
  }, [
    sendPrompt,
    regenerate,
    newConversation,
    handleExport,
    clearConversation,
    requestType,
    setRequestType,
    kbOpen,
    setKbOpen,
    setHistoryOpen,
    setSnippetsOpen,
    setShortcutsOpen,
    theme,
    setTheme,
    close,
  ]);

  // Group actions + presets
  const grouped = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    for (const a of actions) {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    }
    // Add presets group
    if (presets.length > 0) {
      const presetItems: ActionItem[] = presets.map((p) => ({
        id: `preset-${p.id}`,
        label: p.title,
        hint: p.requestType,
        icon: Bookmark,
        group: "Prompt Presets",
        keywords: p.prompt.slice(0, 80),
        run: () => {
          useAssistantStore.getState().setPrompt(p.prompt);
          if (p.requestType) {
            setRequestType(p.requestType as RequestType);
          }
          toast.success("Preset loaded");
          close();
        },
      }));
      map.set("Prompt Presets", presetItems);
    }
    return Array.from(map.entries());
  }, [actions, presets, setRequestType, close]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(80vh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search and run commands, switch modes, load presets.
        </DialogDescription>
        <CommandPrimitive
          label="Command Menu"
          className="flex min-h-0 flex-col overflow-hidden rounded-lg"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <CommandPrimitive.List className="min-h-0 max-h-[60vh] flex-1 overflow-y-auto overflow-x-hidden p-1">
            <CommandPrimitive.Empty>
              <div className="flex flex-col items-center gap-1 py-8 text-center text-muted-foreground">
                <Search className="h-6 w-6 opacity-30" />
                <p className="text-xs">No results for &quot;{search}&quot;</p>
              </div>
            </CommandPrimitive.Empty>

            {grouped.map(([group, items]) => (
              <CommandPrimitive.Group
                key={group}
                heading={group}
                className=" [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandPrimitive.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords || ""}`}
                      onSelect={() => item.run()}
                      className="group flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground group-data-[selected=true]:bg-primary/15 group-data-[selected=true]:text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                      <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100" />
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              CodeMentor Command Palette
            </span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                  ↵
                </kbd>
                select
              </span>
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
