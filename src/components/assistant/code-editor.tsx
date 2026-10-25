"use client";

import { useMemo, useRef, useEffect } from "react";
import { Code2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistantStore } from "@/store/assistant-store";
import { FILE_TYPES } from "@/lib/knowledge-base";

/**
 * A lightweight code editor with line numbers.
 * Uses a textarea overlaid on a line-number gutter.
 */
export function CodeEditor() {
  const selectedCode = useAssistantStore((s) => s.selectedCode);
  const setSelectedCode = useAssistantStore((s) => s.setSelectedCode);
  const fileType = useAssistantStore((s) => s.fileType);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = useMemo(
    () => (selectedCode ? selectedCode.split("\n").length : 1),
    [selectedCode]
  );

  // Sync scroll between textarea and gutter
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const gutter = ta.parentElement?.querySelector(
      "[data-gutter]"
    ) as HTMLDivElement | null;
    if (!gutter) return;
    const onScroll = () => {
      gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  const langLabel =
    FILE_TYPES.find((f) => f.value === fileType)?.label || fileType;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Code2 className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Selected Code</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-mono text-[10px]">{langLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          {selectedCode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[10px]"
              onClick={() => setSelectedCode("")}
            >
              <Eraser className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex min-h-[120px] flex-1 overflow-hidden">
        <div
          data-gutter
          aria-hidden
          className="select-none overflow-hidden border-r border-border bg-muted/20 px-2 py-2 text-right font-mono text-[11px] leading-[1.6] text-muted-foreground/60"
          style={{ minWidth: "2.5rem" }}
        >
          {Array.from({ length: Math.max(lineCount, 8) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={taRef}
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          spellCheck={false}
          placeholder={
            "// Paste the code you want to refactor, explain, or debug here.\n// Leave empty for pure generation requests."
          }
          className="flex-1 resize-none bg-transparent px-3 py-2 font-mono text-[12.5px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground/40"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
