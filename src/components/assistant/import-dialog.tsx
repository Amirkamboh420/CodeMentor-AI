"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileJson,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssistantStore } from "@/store/assistant-store";
import {
  readConversationFile,
  type ExportableConversation,
} from "@/lib/json-export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ImportDialog() {
  const open = useAssistantStore((s) => s.importOpen);
  const setOpen = useAssistantStore((s) => s.setImportOpen);

  const [parsed, setParsed] = useState<ExportableConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setParsed(null);
    setError(null);
    setImporting(false);
    setDragOver(false);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    const conv = await readConversationFile(file);
    if (!conv) {
      setError("Invalid file: not a valid CodeMentor conversation JSON.");
      return;
    }
    setParsed(conv);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = useCallback(async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const res = await fetch("/api/conversations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Import failed: ${res.status}`);
      }
      const data = await res.json();
      toast.success(
        `Imported "${parsed.title}" with ${parsed.messages.length} messages`
      );
      setOpen(false);
      reset();
      // Auto-open the imported conversation so the user sees it immediately
      const convId = data.conversation?.id;
      if (convId) {
        try {
          const loadRes = await fetch(`/api/conversations/${convId}`);
          if (loadRes.ok) {
            const loadData = await loadRes.json();
            const loadedConv = loadData.conversation;
            const store = useAssistantStore.getState();
            const msgs = (loadedConv.messages || []).map(
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
                requestType:
                  (m.requestType as
                    | "generate"
                    | "refactor"
                    | "explain"
                    | "debug") || undefined,
                prompt: m.prompt || undefined,
                code: m.code || undefined,
                feedback:
                  (m.feedback as "yes" | "partial" | "no" | null) || undefined,
                createdAt: new Date(m.createdAt).getTime(),
              })
            );
            store.setMessages(msgs);
            store.setConversationId(loadedConv.id);
          }
        } catch {
          // If auto-load fails, fall back to opening the history sidebar
          useAssistantStore.getState().setHistoryOpen(true);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }, [parsed, setOpen, reset]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        // Delay reset so the close animation isn't interrupted
        setTimeout(reset, 200);
      }
    },
    [setOpen, reset]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4 text-emerald-500" />
            Import Conversation
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Import a conversation from a previously-exported JSON file. The
            conversation and all its messages will be restored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Drop zone / file picker */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragOver
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-border hover:border-foreground/30 hover:bg-accent/50"
            )}
          >
            <FileJson className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs font-medium">
              {dragOver ? "Drop the file here" : "Click or drag a JSON file"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Expects a .json file exported from CodeMentor AI
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-700 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {parsed && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] uppercase">
                  {parsed.requestType || "generate"}
                </Badge>
                <span className="line-clamp-1 flex-1 text-xs font-medium">
                  {parsed.title}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{parsed.messages.length} messages</span>
                {parsed.pinned && (
                  <Badge
                    variant="outline"
                    className="h-3.5 px-1 text-[8px] font-normal"
                  >
                    Pinned
                  </Badge>
                )}
                {parsed.tags && (
                  <span className="line-clamp-1">
                    Tags: {parsed.tags}
                  </span>
                )}
              </div>
              {/* Message role summary */}
              <div className="flex items-center gap-2 pt-1">
                {parsed.messages.slice(0, 6).map((m, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                      m.role === "user"
                        ? "bg-primary/15 text-primary"
                        : "bg-emerald-500/15 text-emerald-600"
                    )}
                    title={`${m.role}: ${m.content.slice(0, 50)}...`}
                  >
                    {m.role === "user" ? "U" : "A"}
                  </span>
                ))}
                {parsed.messages.length > 6 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{parsed.messages.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {parsed && (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-[11px]"
                onClick={reset}
                disabled={importing}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-emerald-600 text-[11px] hover:bg-emerald-700"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" /> Import conversation
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
