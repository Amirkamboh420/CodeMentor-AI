"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  History,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Loader2,
  Pin,
  PinOff,
  Search,
  Pencil,
  Check,
  X,
  Tag as TagIcon,
  Download,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAssistantStore, type ChatMessage } from "@/store/assistant-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationItem {
  id: string;
  title: string;
  requestType: string;
  techStack: string;
  pinned: boolean;
  tags: string;
  updatedAt: string;
  _count: { messages: number };
  totalTokens?: number;
}

export function HistorySidebar() {
  const historyOpen = useAssistantStore((s) => s.historyOpen);
  const setHistoryOpen = useAssistantStore((s) => s.setHistoryOpen);
  const setMessages = useAssistantStore((s) => s.setMessages);
  const setConversationId = useAssistantStore((s) => s.setConversationId);
  const clearConversation = useAssistantStore((s) => s.clearConversation);

  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [taggingId, setTaggingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  const load = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/conversations?q=${encodeURIComponent(searchQuery)}`
        : "/api/conversations";
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.conversations || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpen) load();
  }, [historyOpen, load]);

  // Debounced server-side search across message content.
  // When the query changes (and the sidebar is open), re-fetch from the
  // server after a short delay so we can match message bodies, not just
  // title/type/tags.
  useEffect(() => {
    if (!historyOpen) return;
    const q = query.trim();
    if (!q) {
      load();
      return;
    }
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [query, historyOpen, load]);

  // Collect all unique tags across conversations for the tag filter bar
  const allTags = useMemo(() => {
    const set = new Map<string, number>();
    for (const c of items) {
      const tags = (c.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      for (const t of tags) {
        set.set(t, (set.get(t) || 0) + 1);
      }
    }
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeTag) {
      list = list.filter((c) =>
        (c.tags || "")
          .split(",")
          .map((t) => t.trim())
          .includes(activeTag)
      );
    }
    // Note: text search is now performed server-side (see load(q)), so we
    // don't re-filter by query here — the server already returned only
    // matching conversations.
    return list;
  }, [items, activeTag]);

  const pinnedItems = filtered.filter((c) => c.pinned);
  const otherItems = filtered.filter((c) => !c.pinned);

  const startTagging = (c: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaggingId(c.id);
    setTagInput((c.tags || "").split(",").map((t) => t.trim()).filter(Boolean).join(", "));
  };

  const saveTags = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ");
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, tags } : c))
        );
        toast.success("Tags updated");
      }
    } catch {
      toast.error("Failed to update tags");
    }
    setTaggingId(null);
  };

  const cancelTagging = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTaggingId(null);
  };

  const openConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      const conv = data.conversation;
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
          // Map the historical code snapshot so the diff view can compare
          // against the code present when the request was sent, even for
          // conversations loaded from the database.
          code: m.code || undefined,
          feedback: (m.feedback as ChatMessage["feedback"]) || undefined,
          createdAt: new Date(m.createdAt).getTime(),
        })
      );
      setMessages(msgs);
      setConversationId(conv.id);
      setActiveId(conv.id);
      setHistoryOpen(false);
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const togglePin = async (id: string, pinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !pinned } : c))
    );
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
      toast.success(!pinned ? "Pinned to top" : "Unpinned");
    } catch {
      // revert
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned } : c))
      );
      toast.error("Failed to update");
    }
  };

  const removeConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        clearConversation();
        setActiveId(null);
      }
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const startRename = (c: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, title: editTitle.trim() } : c
          )
        );
        toast.success("Conversation renamed");
      }
    } catch {
      toast.error("Rename failed");
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const startNew = () => {
    clearConversation();
    setActiveId(null);
    setHistoryOpen(false);
  };

  const handleExportAll = async () => {
    try {
      const res = await fetch("/api/conversations/export-all");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      // Trigger a client-side download
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codementor-all-conversations-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${data.count} conversations`);
    } catch {
      toast.error("Bulk export failed");
    }
  };

  const renderRow = (c: ConversationItem) => {
    const isEditing = editingId === c.id;
    const isTagging = taggingId === c.id;
    const tagList = (c.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return (
      <button
        key={c.id}
        onClick={() => !isEditing && !isTagging && openConversation(c.id)}
        className={cn(
          "group relative flex w-full flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors",
          activeId === c.id
            ? "border-primary/40 bg-primary/5"
            : "border-transparent hover:bg-accent",
          (isEditing || isTagging) && "cursor-default border-primary/40 bg-primary/5"
        )}
      >
        {c.pinned && !isEditing && !isTagging && (
          <Pin className="absolute right-1.5 top-1.5 h-2.5 w-2.5 fill-amber-500 text-amber-500" />
        )}
        <div className="flex items-start justify-between gap-2 pr-4">
          {isEditing ? (
            <div
              className="flex w-full items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    saveRename(c.id, e as unknown as React.MouseEvent);
                  if (e.key === "Escape") cancelRename(e as unknown as React.MouseEvent);
                }}
                className="h-6 text-xs"
                autoFocus
              />
              <button
                onClick={(e) => saveRename(c.id, e)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-emerald-600 hover:bg-emerald-500/15"
                aria-label="Save name"
                title="Save"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={cancelRename}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <span className="line-clamp-1 text-xs font-medium">{c.title}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="h-4 px-1 text-[9px] uppercase"
          >
            {c.requestType}
          </Badge>
          {c._count.messages > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-2.5 w-2.5" />
              {c._count.messages}
            </span>
          )}
          {c.totalTokens != null && c.totalTokens > 0 && (
            <span
              className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70"
              title={`~${c.totalTokens} tokens`}
            >
              <Hash className="h-2.5 w-2.5" />
              {c.totalTokens > 1000
                ? `${(c.totalTokens / 1000).toFixed(1)}k`
                : c.totalTokens}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {new Date(c.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {/* Tags row */}
        {!isEditing && !isTagging && tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tagList.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-600 dark:text-violet-400"
              >
                <TagIcon className="h-2 w-2" />
                {t}
              </span>
            ))}
            {tagList.length > 4 && (
              <span className="text-[9px] text-muted-foreground">
                +{tagList.length - 4}
              </span>
            )}
          </div>
        )}
        {/* Tag editor */}
        {isTagging && (
          <div
            className="relative flex w-full items-center gap-1 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <TagIcon className="h-3 w-3 shrink-0 text-violet-500" />
            <Input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setActiveSuggestionIdx(0);
              }}
              onKeyDown={(e) => {
                // Compute suggestions here so we can navigate them
                const parts = tagInput.split(",");
                const lastToken = (parts[parts.length - 1] || "").trim().toLowerCase();
                const priorTags = parts
                  .slice(0, -1)
                  .map((t) => t.trim())
                  .filter(Boolean);
                const suggestions = lastToken
                  ? allTags
                      .filter(
                        ({ tag }) =>
                          tag.toLowerCase().startsWith(lastToken) &&
                          !priorTags.includes(tag)
                      )
                      .slice(0, 5)
                  : [];
                if (e.key === "ArrowDown" && suggestions.length > 0) {
                  e.preventDefault();
                  setActiveSuggestionIdx((i) =>
                    Math.min(i + 1, suggestions.length - 1)
                  );
                  return;
                }
                if (e.key === "ArrowUp" && suggestions.length > 0) {
                  e.preventDefault();
                  setActiveSuggestionIdx((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter" && suggestions.length > 0) {
                  e.preventDefault();
                  const sel = suggestions[activeSuggestionIdx];
                  if (sel) {
                    const newParts = [...priorTags, sel.tag];
                    setTagInput(newParts.join(", ") + ", ");
                    setActiveSuggestionIdx(0);
                    return;
                  }
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTags(c.id, e as unknown as React.MouseEvent);
                }
                if (e.key === "Escape")
                  cancelTagging(e as unknown as React.MouseEvent);
              }}
              placeholder="react, hooks, bug..."
              className="h-6 text-[11px]"
              autoFocus
            />
            {/* Tag autocomplete dropdown */}
            {(() => {
              // Compute the token being typed (after the last comma)
              const parts = tagInput.split(",");
              const lastToken = (parts[parts.length - 1] || "").trim().toLowerCase();
              const priorTags = parts
                .slice(0, -1)
                .map((t) => t.trim())
                .filter(Boolean);
              const suggestions = lastToken
                ? allTags
                    .filter(
                      ({ tag }) =>
                        tag.toLowerCase().startsWith(lastToken) &&
                        !priorTags.includes(tag)
                    )
                    .slice(0, 5)
                : [];
              if (suggestions.length === 0) return null;
              const applySuggestion = (tag: string) => {
                const newParts = [...priorTags, tag];
                setTagInput(newParts.join(", ") + ", ");
                setActiveSuggestionIdx(0);
              };
              return (
                <div className="absolute left-6 top-7 z-20 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
                  <p className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggestions
                  </p>
                  {suggestions.map(({ tag, count }, idx) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => applySuggestion(tag)}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px]",
                        idx === activeSuggestionIdx
                          ? "bg-accent text-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <TagIcon className="h-2.5 w-2.5 text-violet-500" />
                      <span className="flex-1 truncate">{tag}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
            <button
              onClick={(e) => saveTags(c.id, e)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-emerald-600 hover:bg-emerald-500/15"
              aria-label="Save tags"
              title="Save tags"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={cancelTagging}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
              aria-label="Cancel"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {/* Hover actions */}
        {!isEditing && !isTagging && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => togglePin(c.id, c.pinned, e)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={c.pinned ? "Unpin" : "Pin"}
              title={c.pinned ? "Unpin" : "Pin to top"}
            >
              {c.pinned ? (
                <PinOff className="h-3 w-3" />
              ) : (
                <Pin className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={(e) => startTagging(c, e)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-violet-600"
              aria-label="Edit tags"
              title="Edit tags"
            >
              <TagIcon className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => startRename(c, e)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Rename"
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => removeConversation(c.id, e)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </button>
    );
  };

  return (
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent side="left" className="w-full p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" /> History
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportAll}
                className="h-7 gap-1 text-xs text-muted-foreground"
                title="Export all conversations to JSON (backup)"
              >
                <Download className="h-3 w-3" /> All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={startNew}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" /> New
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Search */}
        {items.length > 0 && (
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-8 pl-7 text-xs"
              />
            </div>
            {/* Tag filter chips */}
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {allTags.map(({ tag, count }) => {
                  const isActive = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(isActive ? null : tag)}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                        isActive
                          ? "bg-violet-500 text-white"
                          : "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400"
                      )}
                      title={`Filter by "${tag}" (${count})`}
                    >
                      <TagIcon className="h-2 w-2" />
                      {tag}
                      <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-2 w-2" /> Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-40" />
              {query.trim() ? (
                <>
                  <p className="text-xs">
                    No matches for &quot;{query}&quot;
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Searched titles, tags, and message content
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs">No conversations yet</p>
                  <p className="text-[10px]">
                    Your past sessions will appear here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-9rem)]">
              <div className="space-y-3 p-2">
                {pinnedItems.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 px-1 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      <Pin className="h-2.5 w-2.5" /> Pinned
                    </p>
                    <div className="space-y-1">{pinnedItems.map(renderRow)}</div>
                  </div>
                )}
                {otherItems.length > 0 && (
                  <div>
                    {pinnedItems.length > 0 && (
                      <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Recent
                      </p>
                    )}
                    <div className="space-y-1">{otherItems.map(renderRow)}</div>
                  </div>
                )}
                {filtered.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <p>No matches for &quot;{query}&quot;</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      Searched titles, tags, and message content
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
