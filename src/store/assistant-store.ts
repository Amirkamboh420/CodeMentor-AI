"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RequestType = "generate" | "refactor" | "explain" | "debug";
export type DeveloperLevel = "beginner" | "intermediate" | "advanced";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  requestType?: RequestType;
  prompt?: string;
  code?: string;
  feedback?: "yes" | "partial" | "no";
  createdAt: number;
}

interface AssistantState {
  // request configuration
  requestType: RequestType;
  developerLevel: DeveloperLevel;
  techStack: string[];
  fileType: string;
  filePath: string;
  timeConstraint: string;

  // input state
  prompt: string;
  selectedCode: string;

  // conversation state
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingError: string | null;

  // ui state
  historyOpen: boolean;
  kbOpen: boolean;
  snippetsOpen: boolean;
  shortcutsOpen: boolean;
  paletteOpen: boolean;
  presetsOpen: boolean;
  shareOpen: boolean;
  importOpen: boolean;
  diffMessageId: string | null;
  theme: "light" | "dark";

  // setters
  setRequestType: (t: RequestType) => void;
  setDeveloperLevel: (l: DeveloperLevel) => void;
  toggleTech: (t: string) => void;
  setFileType: (f: string) => void;
  setFilePath: (f: string) => void;
  setTimeConstraint: (t: string) => void;
  setPrompt: (p: string) => void;
  setSelectedCode: (c: string) => void;

  setConversationId: (id: string | null) => void;
  setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void;
  appendToLast: (text: string) => void;
  setStreaming: (s: boolean) => void;
  setStreamingError: (e: string | null) => void;
  clearConversation: () => void;

  setHistoryOpen: (o: boolean) => void;
  setKbOpen: (o: boolean) => void;
  setSnippetsOpen: (o: boolean) => void;
  setShortcutsOpen: (o: boolean) => void;
  setPaletteOpen: (o: boolean) => void;
  setPresetsOpen: (o: boolean) => void;
  setShareOpen: (o: boolean) => void;
  setImportOpen: (o: boolean) => void;
  setDiffMessageId: (id: string | null) => void;
  toggleTheme: () => void;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      requestType: "generate",
      developerLevel: "intermediate",
      techStack: ["Next.js 16", "TypeScript", "Tailwind CSS"],
      fileType: "typescript",
      filePath: "src/components/example.ts",
      timeConstraint: "",

      prompt: "",
      selectedCode: "",

      conversationId: null,
      messages: [],
      isStreaming: false,
      streamingError: null,

      historyOpen: false,
      kbOpen: true,
      snippetsOpen: false,
      shortcutsOpen: false,
      paletteOpen: false,
      presetsOpen: false,
      shareOpen: false,
      importOpen: false,
      diffMessageId: null,
      theme: "dark",

      setRequestType: (t) => set({ requestType: t }),
      setDeveloperLevel: (l) => set({ developerLevel: l }),
      toggleTech: (t) =>
        set((s) => ({
          techStack: s.techStack.includes(t)
            ? s.techStack.filter((x) => x !== t)
            : [...s.techStack, t],
        })),
      setFileType: (f) => set({ fileType: f }),
      setFilePath: (f) => set({ filePath: f }),
      setTimeConstraint: (t) => set({ timeConstraint: t }),
      setPrompt: (p) => set({ prompt: p }),
      setSelectedCode: (c) => set({ selectedCode: c }),

      setConversationId: (id) => set({ conversationId: id }),
      setMessages: (m) => set({ messages: m }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      appendToLast: (text) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + text };
          }
          return { messages: msgs };
        }),
      setStreaming: (s) => set({ isStreaming: s }),
      setStreamingError: (e) => set({ streamingError: e }),
      clearConversation: () =>
        set({
          conversationId: null,
          messages: [],
          prompt: "",
          selectedCode: "",
          streamingError: null,
        }),

      setHistoryOpen: (o) => set({ historyOpen: o }),
      setKbOpen: (o) => set({ kbOpen: o }),
      setSnippetsOpen: (o) => set({ snippetsOpen: o }),
      setShortcutsOpen: (o) => set({ shortcutsOpen: o }),
      setPaletteOpen: (o) => set({ paletteOpen: o }),
      setPresetsOpen: (o) => set({ presetsOpen: o }),
      setShareOpen: (o) => set({ shareOpen: o }),
      setImportOpen: (o) => set({ importOpen: o }),
      setDiffMessageId: (id) => set({ diffMessageId: id }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "codementor-store",
      partialize: (s) => ({
        requestType: s.requestType,
        developerLevel: s.developerLevel,
        techStack: s.techStack,
        fileType: s.fileType,
        filePath: s.filePath,
        kbOpen: s.kbOpen,
        theme: s.theme,
      }),
    }
  )
);

export { uid };
