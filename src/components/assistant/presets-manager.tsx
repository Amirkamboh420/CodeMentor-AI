"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Trash2,
  Bookmark,
  Loader2,
  Play,
  Pencil,
  Check,
  X,
  Code2,
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
import { useAssistantStore, type RequestType } from "@/store/assistant-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Preset {
  id: string;
  title: string;
  prompt: string;
  requestType: string;
  techStack: string;
  createdAt: string;
  updatedAt: string;
}

const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "generate", label: "Generate" },
  { value: "refactor", label: "Refactor" },
  { value: "explain", label: "Explain" },
  { value: "debug", label: "Debug" },
];

export function PresetsManager() {
  const open = useAssistantStore((s) => s.presetsOpen);
  const setOpen = useAssistantStore((s) => s.setPresetsOpen);
  const setPrompt = useAssistantStore((s) => s.setPrompt);
  const setRequestType = useAssistantStore((s) => s.setRequestType);
  const setPaletteOpen = useAssistantStore((s) => s.setPaletteOpen);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      setPresets(data.prompts || []);
    } catch {
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const filtered = useMemo(() => {
    let list = presets;
    if (typeFilter !== "all") {
      list = list.filter((p) => p.requestType === typeFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [presets, query, typeFilter]);

  const handleLoad = (p: Preset) => {
    setPrompt(p.prompt);
    if (p.requestType) {
      setRequestType(p.requestType as RequestType);
    }
    setOpen(false);
    setPaletteOpen(false);
    toast.success("Preset loaded into editor");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      setPresets((prev) => prev.filter((p) => p.id !== id));
      if (openId === id) setOpenId(null);
      toast.success("Preset deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const startEdit = (p: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditTitle(p.title);
  };

  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setPresets((prev) =>
          prev.map((p) => (p.id === id ? { ...p, title: editTitle.trim() } : p))
        );
        toast.success("Preset renamed");
      }
    } catch {
      toast.error("Rename failed");
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Bookmark className="h-4 w-4 text-emerald-500" />
            Prompt Presets
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Saved prompts you can load into the editor. Rename, filter, or
            delete presets. Create new ones with the &quot;Save Prompt&quot;
            button in the composer.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search presets..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {REQUEST_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
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
              <Bookmark className="h-10 w-10 opacity-30" />
              <p className="text-xs">
                {presets.length === 0
                  ? "No presets yet"
                  : "No presets match your filter"}
              </p>
              <p className="max-w-xs text-[10px]">
                {presets.length === 0
                  ? "Type a prompt in the composer, then click \"Save Prompt\" to create a preset."
                  : "Try a different search or type filter."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2 p-3">
                {filtered.map((p) => {
                  const isOpen = openId === p.id;
                  const isEditing = editingId === p.id;
                  const tags = (p.techStack || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "overflow-hidden rounded-lg border bg-card transition-colors",
                        isOpen ? "border-primary/40" : "border-border"
                      )}
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : p.id)}
                        className="flex w-full items-center gap-2 p-2.5 text-left"
                      >
                        <Bookmark className="h-4 w-4 shrink-0 text-emerald-500" />
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    saveEdit(p.id, e as unknown as React.MouseEvent);
                                  if (e.key === "Escape") cancelEdit(e as unknown as React.MouseEvent);
                                }}
                                className="h-6 text-xs"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => saveEdit(p.id, e)}
                              >
                                <Check className="h-3 w-3 text-emerald-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={cancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <p className="truncate text-xs font-medium">
                              {p.title}
                            </p>
                          )}
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="h-3.5 px-1 text-[8px] uppercase"
                            >
                              {p.requestType}
                            </Badge>
                            <span className="text-muted-foreground/70">
                              {new Date(p.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {!isEditing && (
                          <button
                            onClick={(e) => startEdit(p, e)}
                            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                            aria-label="Rename"
                            title="Rename"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </button>

                      {isOpen && !isEditing && (
                        <div className="border-t border-border bg-muted/20">
                          {/* Prompt preview */}
                          <div className="flex items-start gap-1.5 px-3 py-2">
                            <Code2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                            <p className="line-clamp-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                              {p.prompt}
                            </p>
                          </div>
                          {/* Tags + actions */}
                          <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
                            {tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
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
                                className="h-7 gap-1 text-[11px] text-destructive hover:text-destructive"
                                onClick={(e) => handleDelete(p.id, e)}
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 gap-1 text-[11px]"
                                onClick={() => handleLoad(p)}
                              >
                                <Play className="h-3 w-3" /> Load
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
