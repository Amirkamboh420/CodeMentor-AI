"use client";

import { useCallback, useRef } from "react";
import { useAssistantStore, uid, type ChatMessage, type RequestType } from "@/store/assistant-store";
import { toast } from "sonner";

interface AssistRequestBody {
  requestType: RequestType;
  userPrompt: string;
  selectedCode: string;
  filePath: string;
  fileType: string;
  techStack: string[];
  developerLevel: string;
  timeConstraint?: string;
  history: { role: "user" | "assistant"; content: string }[];
}

/**
 * Shared assistant actions. Lifts the streaming-send logic out of the
 * PromptInput component so that Regenerate, the Command Palette, and any
 * other component can trigger a send.
 *
 * `sendPrompt(prompt?)` sends an explicit prompt (or the current store
 * prompt if omitted). `regenerate()` re-runs the last user prompt.
 */
export function useAssistantActions() {
  const store = useAssistantStore();
  const abortRef = useRef<AbortController | null>(null);

  const runSend = useCallback(
    async (promptText: string) => {
      const userPrompt = promptText.trim();
      if (!userPrompt) {
        toast.error("Please enter a prompt");
        return;
      }
      if (useAssistantStore.getState().isStreaming) {
        toast.error("A response is already streaming");
        return;
      }

      const state = useAssistantStore.getState();
      const recent = state.messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestType = state.requestType;
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: userPrompt,
        requestType,
        prompt: userPrompt,
        // Snapshot the editor code at send time so the diff view can
        // compare against the historical original, not just the current
        // editor content (which may have changed since).
        code: state.selectedCode,
        createdAt: Date.now(),
      };
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        requestType,
        createdAt: Date.now(),
      };

      store.addMessage(userMsg);
      store.addMessage(assistantMsg);
      store.setPrompt("");
      store.setStreaming(true);
      store.setStreamingError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const body: AssistRequestBody = {
        requestType,
        userPrompt,
        selectedCode: state.selectedCode,
        filePath: state.filePath,
        fileType: state.fileType,
        techStack: state.techStack,
        developerLevel: state.developerLevel,
        timeConstraint: state.timeConstraint || undefined,
        history: recent,
      };

      try {
        const url = state.conversationId
          ? `/api/assist?conversationId=${state.conversationId}`
          : `/api/assist`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            try {
              const evt = JSON.parse(json);
              if (evt.type === "meta") {
                if (evt.conversationId) {
                  store.setConversationId(evt.conversationId);
                }
              } else if (evt.type === "delta") {
                store.appendToLast(evt.text);
              } else if (evt.type === "error") {
                store.setStreamingError(evt.message);
                toast.error(evt.message);
              }
            } catch {
              // partial chunk, ignore
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // user cancelled
        } else {
          const msg = err instanceof Error ? err.message : "Unknown error";
          store.setStreamingError(msg);
          toast.error("Assistant error: " + msg);
        }
      } finally {
        store.setStreaming(false);
        abortRef.current = null;
      }
    },
    [store]
  );

  const sendPrompt = useCallback(
    (promptText?: string) => {
      const text = promptText ?? useAssistantStore.getState().prompt;
      runSend(text);
    },
    [runSend]
  );

  const regenerate = useCallback(() => {
    const state = useAssistantStore.getState();
    if (state.isStreaming) {
      toast.error("Wait for the current response to finish");
      return;
    }
    const msgs = state.messages;
    // Find the last user message
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser || !lastUser.prompt) {
      toast.error("Nothing to regenerate yet");
      return;
    }
    // Drop the last assistant message (the one immediately after the last user msg)
    // Find index of last assistant message that comes after lastUser
    const lastUserIdx = msgs.findIndex((m) => m.id === lastUser.id);
    const after = msgs.slice(lastUserIdx + 1);
    const lastAssistantIdx = after.findIndex((m) => m.role === "assistant");
    if (lastAssistantIdx !== -1) {
      const removeIdx = lastUserIdx + 1 + lastAssistantIdx;
      const next = msgs.filter((_, i) => i !== removeIdx);
      store.setMessages(next);
    }
    runSend(lastUser.prompt);
  }, [store, runSend]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    store.setStreaming(false);
  }, [store]);

  const newConversation = useCallback(() => {
    if (useAssistantStore.getState().isStreaming) {
      abortRef.current?.abort();
    }
    store.clearConversation();
  }, [store]);

  return { sendPrompt, regenerate, stop, newConversation };
}
