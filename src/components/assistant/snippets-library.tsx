"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Copy,
  Check,
  Trash2,
  FileCode2,
  Loader2,
  ClipboardPaste,
  Calendar,
  Tag,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssistantStore } from "@/store/assistant-store";
import { FILE_TYPES } from "@/lib/knowledge-base";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export function SnippetsLibrary() {
  const open = useAssistantStore((s) => s.snippetsOpen);
  const setOpen = useAssistantStore((s) => s.setSnippetsOpen);
  const setSelectedCode = useAssistantStore((s) => s.setSelectedCode);
  const setFileType = useAssistantStore((s) => s.setFileType);

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLanguage, setEditLanguage] = useState("typescript");
  const [editTags, setEditTags] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/snippets");
      const data = await res.json();
      setSnippets(data.snippets || []);
    } catch {
      toast.error("Failed to load snippets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const languages = useMemo(() => {
    const set = new Set(snippets.map((s) => s.language));
    return ["all", ...Array.from(set)];
  }, [snippets]);

  const filtered = useMemo(() => {
    let list = snippets;
    if (langFilter !== "all") {
      list = list.filter((s) => s.language === langFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.tags || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [snippets, query, langFilter]);

  const handleCopy = async (s: Snippet) => {
    await navigator.clipboard.writeText(s.code);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleInsert = (s: Snippet) => {
    setSelectedCode(s.code);
    setFileType(s.language);
    setOpen(false);
    toast.success("Inserted into editor");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/snippets/${id}`, { method: "DELETE" });
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      if (openId === id) setOpenId(null);
      toast.success("Snippet deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const startEdit = (s: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditCode(s.code);
    setEditLanguage(s.language);
    setEditTags(
      (s.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ")
    );
    if (openId !== s.id) setOpenId(s.id);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim() || !editCode.trim()) {
      toast.error("Title and code are required");
      return;
    }
    const tags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ");
    try {
      const res = await fetch(`/api/snippets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          code: editCode,
          language: editLanguage,
          tags,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSnippets((prev) =>
          prev.map((s) => (s.id === id ? data.snippet : s))
        );
        toast.success("Snippet updated");
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("Network error");
    }
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileCode2 className="h-4 w-4 text-emerald-500" />
            Snippets Library
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Saved code snippets from AI responses. Insert into the editor or
            copy to clipboard.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search snippets..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={langFilter} onValueChange={setLangFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "all" ? "All languages" : l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="h-8 px-2 text-[10px]">
            {filtered.length}
          </Badge>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <FileCode2 className="h-10 w-10 opacity-30" />
              <p className="text-xs">
                {snippets.length === 0
                  ? "No snippets yet"
                  : "No snippets match your filter"}
              </p>
              <p className="max-w-xs text-[10px]">
                {snippets.length === 0
                  ? "Save an AI response with the Save button, and it will appear here."
                  : "Try a different search or language filter."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2 p-3">
                {filtered.map((s) => {
                  const isOpen = openId === s.id;
                  const isEditing = editingId === s.id;
                  const tags = (s.tags || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "overflow-hidden rounded-lg border bg-card transition-colors",
                        isOpen ? "border-primary/40" : "border-border"
                      )}
                    >
                      <button
                        onClick={() => {
                          if (isEditing) return;
                          setOpenId(isOpen ? null : s.id);
                        }}
                        className="flex w-full items-center gap-2 p-2.5 text-left"
                      >
                        <FileCode2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {s.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono">{s.language}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(s.updatedAt).toLocaleDateString()}
                            </span>
                            {s.source === "ai" && (
                              <Badge
                                variant="outline"
                                className="h-3.5 px-1 text-[8px] font-normal"
                              >
                                AI
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => startEdit(s, e)}
                              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                              aria-label="Edit"
                              title="Edit snippet"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(s.id, e)}
                              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-destructive group-hover:opacity-100"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </button>

                      {isOpen && !isEditing && (
                        <div className="border-t border-border bg-muted/20">
                          {/* Code preview */}
                          <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
                            {s.code.slice(0, 1200)}
                            {s.code.length > 1200 && "\n... (truncated)"}
                          </pre>
                          {/* Tags + actions */}
                          <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
                            {tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <Tag className="h-2.5 w-2.5 text-muted-foreground" />
                                {tags.slice(0, 4).map((t) => (
                                  <Badge
                                    key={t}
                                    variant="secondary"
                                    className="h-4 px-1 text-[9px] font-normal"
                                  >
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-[11px]"
                                onClick={() => handleCopy(s)}
                              >
                                {copiedId === s.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-500" />{" "}
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" /> Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-[11px]"
                                onClick={(e) => startEdit(s, e)}
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-[11px]"
                                onClick={() => handleInsert(s)}
                              >
                                <ClipboardPaste className="h-3 w-3" /> Insert
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Edit mode */}
                      {isOpen && isEditing && (
                        <div className="border-t border-border bg-muted/20 p-3">
                          <div className="space-y-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Title
                              </label>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="h-7 text-xs"
                                placeholder="Snippet title"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Language
                                </label>
                                <Select
                                  value={editLanguage}
                                  onValueChange={setEditLanguage}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FILE_TYPES.map((f) => (
                                      <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Tags (comma-separated)
                                </label>
                                <Input
                                  value={editTags}
                                  onChange={(e) => setEditTags(e.target.value)}
                                  className="h-7 text-xs"
                                  placeholder="react, hooks, util"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Code
                              </label>
                              <textarea
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value)}
                                className="min-h-[160px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[11px] leading-relaxed outline-none focus:ring-2 focus:ring-ring/40"
                                spellCheck={false}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-[11px]"
                                onClick={cancelEdit}
                              >
                                <X className="h-3 w-3" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 gap-1 bg-emerald-600 text-[11px] hover:bg-emerald-700"
                                onClick={(e) => saveEdit(s.id, e)}
                              >
                                <Save className="h-3 w-3" /> Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
