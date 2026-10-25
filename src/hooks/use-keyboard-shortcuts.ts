"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAssistantStore } from "@/store/assistant-store";

/**
 * Wires up global keyboard shortcuts:
 *  ⌘/Ctrl + N   → new conversation
 *  ⌘/Ctrl + L   → toggle history
 *  ⌘/Ctrl + K   → toggle knowledge base
 *  ⌘/Ctrl + P   → open command palette (overrides browser print)
 *  ⌘/Ctrl + S   → open snippets library (overrides browser save)
 *  ⌘/Ctrl + J   → toggle theme
 *  ? (shift+/)  → show shortcuts help (when not typing in an input)
 *  Esc          → close any open dialog / cancel stream
 */
export function useKeyboardShortcuts() {
  const {
    clearConversation,
    setHistoryOpen,
    historyOpen,
    setKbOpen,
    kbOpen,
    setSnippetsOpen,
    snippetsOpen,
    setShortcutsOpen,
    shortcutsOpen,
    setPaletteOpen,
    paletteOpen,
    setPresetsOpen,
    presetsOpen,
    setShareOpen,
    shareOpen,
    setImportOpen,
    importOpen,
    isStreaming,
    setStreaming,
  } = useAssistantStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // ⌘/Ctrl + N — new conversation
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        clearConversation();
        return;
      }
      // ⌘/Ctrl + L — history
      if (mod && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setHistoryOpen(!historyOpen);
        return;
      }
      // ⌘/Ctrl + K — knowledge base
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setKbOpen(!kbOpen);
        return;
      }
      // ⌘/Ctrl + P — command palette (overrides browser print)
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      // ⌘/Ctrl + S — snippets (overrides browser save)
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSnippetsOpen(!snippetsOpen);
        return;
      }
      // ⌘/Ctrl + J — theme
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
        return;
      }
      // ? — shortcuts help (only when not typing)
      if (e.shiftKey && e.key === "?" && !isTyping) {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
        return;
      }
      // Esc — close dialogs or cancel streaming
      if (e.key === "Escape") {
        if (paletteOpen) {
          setPaletteOpen(false);
          return;
        }
        if (useAssistantStore.getState().diffMessageId) {
          useAssistantStore.getState().setDiffMessageId(null);
          return;
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (shareOpen) {
          setShareOpen(false);
          return;
        }
        if (importOpen) {
          setImportOpen(false);
          return;
        }
        if (presetsOpen) {
          setPresetsOpen(false);
          return;
        }
        if (snippetsOpen) {
          setSnippetsOpen(false);
          return;
        }
        if (historyOpen) {
          setHistoryOpen(false);
          return;
        }
        if (isStreaming) {
          setStreaming(false);
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    clearConversation,
    setHistoryOpen,
    historyOpen,
    setKbOpen,
    kbOpen,
    setSnippetsOpen,
    snippetsOpen,
    setShortcutsOpen,
    shortcutsOpen,
    setPaletteOpen,
    paletteOpen,
    setPresetsOpen,
    presetsOpen,
    setShareOpen,
    shareOpen,
    setImportOpen,
    importOpen,
    isStreaming,
    setStreaming,
    theme,
    setTheme,
  ]);
}
