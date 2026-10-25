"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  Sparkles,
  Trash2,
  Save,
  Loader2,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAssistantStore } from "@/store/assistant-store";
import { useAssistantActions } from "@/hooks/use-assistant-actions";
import { PROMPT_TEMPLATES } from "@/lib/knowledge-base";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PromptInput() {
  const {
    prompt,
    setPrompt,
    requestType,
    fileType,
    techStack,
    messages,
    isStreaming,
    streamingError,
  } = useAssistantStore();

  const { sendPrompt, stop, newConversation } = useAssistantActions();

  const [showTemplates, setShowTemplates] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }, [prompt]);

  const handleSaveSnippet = async () => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant || !lastAssistant.content) {
      toast.error("Nothing to save yet");
      return;
    }
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prompt.slice(0, 60) || "Saved response",
          code: lastAssistant.content,
          language: fileType,
          tags: techStack,
          source: "ai",
        }),
      });
      if (res.ok) {
        toast.success("Saved to snippets");
      } else {
        toast.error("Failed to save snippet");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSavePrompt = async () => {
    if (!prompt.trim()) {
      toast.error("Nothing to save");
      return;
    }
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prompt.slice(0, 60),
          prompt,
          requestType,
          techStack: techStack.join(", "),
        }),
      });
      if (res.ok) {
        toast.success("Prompt saved as preset");
      } else {
        toast.error("Failed to save prompt");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const templates = PROMPT_TEMPLATES[requestType] || [];

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-xl border border-border bg-card shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40 focus-within:shadow-md">
        <Textarea
          ref={taRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Describe what you want to ${requestType}...  (⌘/Ctrl + Enter to send)`}
          className="min-h-[56px] max-h-[220px] resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-[11px] text-muted-foreground"
              onClick={() => setShowTemplates((v) => !v)}
            >
              <Sparkles className="h-3 w-3" />
              Templates
            </Button>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[11px] text-muted-foreground"
                    onClick={handleSavePrompt}
                    disabled={!prompt.trim()}
                  >
                    <Bookmark className="h-3 w-3" /> Save Prompt
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save current prompt as a preset</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {messages.length > 0 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[11px] text-muted-foreground"
                      onClick={handleSaveSnippet}
                    >
                      <Save className="h-3 w-3" /> Save Snippet
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save last response as a snippet</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {messages.length > 0 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                      onClick={newConversation}
                    >
                      <Trash2 className="h-3 w-3" /> New
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start a new conversation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              {prompt.length} chars
            </span>
            {isStreaming ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={stop}
                className="h-8 gap-1"
              >
                <Square className="h-3 w-3" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => sendPrompt()}
                disabled={!prompt.trim()}
                className="h-8 gap-1"
              >
                {streamingError ? (
                  <Loader2 className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Send
              </Button>
            )}
          </div>
        </div>
      </div>

      {showTemplates && (
        <div className="grid gap-1 rounded-lg border border-border bg-popover p-2 sm:grid-cols-2">
          {templates.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPrompt(t);
                setShowTemplates(false);
                taRef.current?.focus();
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="mr-1.5 text-primary/60">→</span>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
