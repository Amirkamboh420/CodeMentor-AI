"use client";

import { useMemo, useState, useCallback } from "react";
import {
  GitCompare,
  Copy,
  Check,
  Download,
  Columns2,
  Rows3,
  Plus,
  Minus,
  Equal,
  CheckCheck,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  computeDiff,
  computeWordDiff,
  diffToText,
  downloadText,
  type DiffLine,
} from "@/lib/conversation-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DiffViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldCode: string;
  newCode: string;
  oldLabel?: string;
  newLabel?: string;
  language?: string;
  /** Called when the user clicks "Apply" — replaces the editor content with newCode. */
  onApply?: (newCode: string) => void;
  /** Optional historical original code (the code present when the request was sent).
   * When provided, a toggle lets the user switch between "current editor" and
   * "historical original" as the diff base. */
  historicalOldCode?: string;
}

type ViewMode = "unified" | "split";

function DiffRow({ line }: { line: DiffLine }) {
  const isAdded = line.type === "added";
  const isRemoved = line.type === "removed";
  const symbol = isAdded ? "+" : isRemoved ? "-" : " ";
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-2 py-0.5 font-mono text-[11px] leading-relaxed",
        isAdded && "bg-emerald-500/10",
        isRemoved && "bg-rose-500/10",
        !isAdded && !isRemoved && "bg-transparent"
      )}
    >
      <span
        className={cn(
          "w-4 shrink-0 select-none text-center font-bold",
          isAdded && "text-emerald-600",
          isRemoved && "text-rose-600",
          !isAdded && !isRemoved && "text-muted-foreground/40"
        )}
      >
        {symbol}
      </span>
      <span className="w-8 shrink-0 select-none text-right text-muted-foreground/50">
        {line.oldNum ?? ""}
      </span>
      <span className="w-8 shrink-0 select-none text-right text-muted-foreground/50">
        {line.newNum ?? ""}
      </span>
      <span
        className={cn(
          "whitespace-pre-wrap break-words",
          isAdded && "text-emerald-700 dark:text-emerald-300",
          isRemoved && "text-rose-700 dark:text-rose-300",
          !isAdded && !isRemoved && "text-foreground/80"
        )}
      >
        {line.text || " "}
      </span>
    </div>
  );
}

function WordDiffContent({
  segments,
  side,
}: {
  segments: { text: string; type: "added" | "removed" | "unchanged" }[];
  side: "old" | "new";
}) {
  // In old-side, highlight removed segments; in new-side, highlight added.
  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        const highlight =
          (side === "old" && seg.type === "removed") ||
          (side === "new" && seg.type === "added");
        return (
          <span
            key={i}
            className={cn(
              highlight &&
                (side === "old"
                  ? "rounded bg-rose-500/25 font-semibold text-rose-800 dark:text-rose-200"
                  : "rounded bg-emerald-500/25 font-semibold text-emerald-800 dark:text-emerald-200")
            )}
          >
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}

function SplitRow({
  oldLine,
  newLine,
}: {
  oldLine?: DiffLine;
  newLine?: DiffLine;
}) {
  // Compute word-level diff for paired removed+added lines to highlight
  // the exact words that changed within the line.
  const wordSegments =
    oldLine?.type === "removed" && newLine?.type === "added"
      ? computeWordDiff(oldLine.text, newLine.text)
      : null;

  return (
    <div className="grid grid-cols-2 gap-px">
      <div
        className={cn(
          "flex items-start gap-2 px-2 py-0.5 font-mono text-[11px] leading-relaxed",
          oldLine?.type === "removed"
            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : oldLine?.type === "unchanged"
              ? "bg-transparent text-foreground/70"
              : "bg-rose-500/5 text-muted-foreground/30"
        )}
      >
        <span className="w-6 shrink-0 select-none text-right text-muted-foreground/40">
          {oldLine?.oldNum ?? ""}
        </span>
        {wordSegments ? (
          <WordDiffContent segments={wordSegments} side="old" />
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {oldLine?.text || " "}
          </span>
        )}
      </div>
      <div
        className={cn(
          "flex items-start gap-2 px-2 py-0.5 font-mono text-[11px] leading-relaxed",
          newLine?.type === "added"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : newLine?.type === "unchanged"
              ? "bg-transparent text-foreground/70"
              : "bg-emerald-500/5 text-muted-foreground/30"
        )}
      >
        <span className="w-6 shrink-0 select-none text-right text-muted-foreground/40">
          {newLine?.newNum ?? ""}
        </span>
        {wordSegments ? (
          <WordDiffContent segments={wordSegments} side="new" />
        ) : (
          <span className="whitespace-pre-wrap break-words">
            {newLine?.text || " "}
          </span>
        )}
      </div>
    </div>
  );
}

export function DiffViewDialog({
  open,
  onOpenChange,
  oldCode,
  newCode,
  oldLabel = "Original",
  newLabel = "Refactored",
  language = "typescript",
  onApply,
  historicalOldCode,
}: DiffViewDialogProps) {
  const [mode, setMode] = useState<ViewMode>("unified");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  // "editor" = current editor content; "historical" = code present at send time
  const [source, setSource] = useState<"editor" | "historical">("editor");

  const hasHistorical =
    !!historicalOldCode && historicalOldCode.trim().length > 0;

  // Use the selected source for the diff base
  const effectiveOldCode =
    source === "historical" && hasHistorical ? historicalOldCode : oldCode;

  const diff = useMemo(
    () => computeDiff(effectiveOldCode, newCode),
    [effectiveOldCode, newCode]
  );

  // For split view, pair up removed+added lines
  const splitRows = useMemo(() => {
    const rows: { oldLine?: DiffLine; newLine?: DiffLine }[] = [];
    let i = 0;
    const lines = diff.lines;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === "unchanged") {
        rows.push({ oldLine: line, newLine: line });
        i++;
      } else if (line.type === "removed") {
        // Pair with the next added line if adjacent
        const next = lines[i + 1];
        if (next && next.type === "added") {
          rows.push({ oldLine: line, newLine: next });
          i += 2;
        } else {
          rows.push({ oldLine: line });
          i++;
        }
      } else {
        // added without a paired removed
        rows.push({ newLine: line });
        i++;
      }
    }
    return rows;
  }, [diff]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(diffToText(diff));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Diff copied");
  }, [diff]);

  const handleDownload = useCallback(() => {
    downloadText(
      `codementor-diff-${Date.now()}.diff`,
      diffToText(diff),
      "text/plain"
    );
    toast.success("Diff downloaded");
  }, [diff]);

  const handleApply = useCallback(() => {
    if (!onApply) return;
    onApply(newCode);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
    toast.success("Refactored code applied to editor");
    onOpenChange(false);
  }, [onApply, newCode, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <GitCompare className="h-4 w-4 text-emerald-500" />
                Code Diff
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Comparing {oldLabel} → {newLabel} · {language}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              {/* View mode toggle */}
              <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
                <button
                  onClick={() => setMode("unified")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    mode === "unified"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Unified view"
                >
                  <Rows3 className="h-3 w-3" />
                  Unified
                </button>
                <button
                  onClick={() => setMode("split")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    mode === "split"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Split view"
                >
                  <Columns2 className="h-3 w-3" />
                  Split
                </button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-[11px]"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-[11px]"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              {onApply && (
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-emerald-600 text-[11px] hover:bg-emerald-700"
                  onClick={handleApply}
                  disabled={diff.identical}
                >
                  <CheckCheck className="h-3 w-3" />
                  {applied ? "Applied" : "Apply"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Stats bar */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-4 py-2 text-[10px]">
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <Plus className="h-2.5 w-2.5" />
            {diff.added} added
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          >
            <Minus className="h-2.5 w-2.5" />
            {diff.removed} removed
          </Badge>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Equal className="h-2.5 w-2.5" />
            {diff.unchanged} unchanged
          </Badge>
          {diff.identical && (
            <span className="text-[10px] italic text-muted-foreground">
              (no changes detected)
            </span>
          )}
          {/* Source toggle: current editor vs historical original */}
          {hasHistorical && (
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Base:
              </span>
              <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
                <button
                  onClick={() => setSource("editor")}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                    source === "editor"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Compare against current editor content"
                >
                  Editor
                </button>
                <button
                  onClick={() => setSource("historical")}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                    source === "historical"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Compare against the code present when the request was sent"
                >
                  Historical
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Diff content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {mode === "unified" ? (
              <div className="py-1">
                {diff.lines.map((line, idx) => (
                  <DiffRow key={idx} line={line} />
                ))}
              </div>
            ) : (
              <div className="py-1">
                {/* Split header */}
                <div className="sticky top-0 z-10 grid grid-cols-2 gap-px border-b border-border bg-muted/60 backdrop-blur-sm">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {oldLabel}
                  </div>
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {newLabel}
                  </div>
                </div>
                {splitRows.map((row, idx) => (
                  <SplitRow
                    key={idx}
                    oldLine={row.oldLine}
                    newLine={row.newLine}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
