"use client";

import { useMemo, useCallback } from "react";
import { DiffViewDialog } from "./diff-view";
import { useAssistantStore } from "@/store/assistant-store";
import { extractAllCode } from "@/lib/conversation-utils";

/**
 * Renders the diff dialog for the currently-targeted message.
 * Driven by `diffMessageId` in the store. Compares the editor's
 * selectedCode (original) against the code extracted from the
 * assistant message (refactored). The "Apply" action replaces the
 * editor content with the refactored code.
 */
export function DiffViewLauncher() {
  const diffMessageId = useAssistantStore((s) => s.diffMessageId);
  const setDiffMessageId = useAssistantStore((s) => s.setDiffMessageId);
  const messages = useAssistantStore((s) => s.messages);
  const selectedCode = useAssistantStore((s) => s.selectedCode);
  const fileType = useAssistantStore((s) => s.fileType);
  const setSelectedCode = useAssistantStore((s) => s.setSelectedCode);

  const targetMessage = useMemo(
    () => messages.find((m) => m.id === diffMessageId),
    [messages, diffMessageId]
  );

  // Find the preceding user message (the one whose code was the
  // original being refactored) so the diff can compare against the
  // historical original, not just the current editor content.
  const historicalOldCode = useMemo(() => {
    if (!targetMessage) return "";
    const idx = messages.findIndex((m) => m.id === targetMessage.id);
    if (idx <= 0) return "";
    // Walk backwards to find the nearest user message with a code snapshot
    for (let i = idx - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "user") {
        return m.code || "";
      }
    }
    return "";
  }, [messages, targetMessage]);

  const newCode = useMemo(
    () => (targetMessage ? extractAllCode(targetMessage.content) : ""),
    [targetMessage]
  );

  const open = !!diffMessageId && !!targetMessage;

  const handleApply = useCallback(
    (code: string) => {
      setSelectedCode(code);
    },
    [setSelectedCode]
  );

  return (
    <DiffViewDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setDiffMessageId(null);
      }}
      oldCode={selectedCode}
      newCode={newCode}
      oldLabel="Original (editor)"
      newLabel="Refactored (AI)"
      language={fileType}
      onApply={handleApply}
      historicalOldCode={historicalOldCode}
    />
  );
}
