"use client";

import { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Copy,
  Check,
  RefreshCw,
  Code2,
  FileDown,
  Clock,
  Hash,
  GitCompare,
  CornerDownRight,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAssistantStore } from "@/store/assistant-store";
import type { ChatMessage } from "@/store/assistant-store";
import {
  extractAllCode,
  countStats,
  messagesToMarkdown,
  downloadText,
} from "@/lib/conversation-utils";

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  totalMessages: number;
  onFeedback?: (msg: ChatMessage, helpful: "yes" | "partial" | "no") => void;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  isLast?: boolean;
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  active,
  activeClass,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
        active
          ? activeClass
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

function FeedbackBar({
  message,
  onFeedback,
  onRegenerate,
}: {
  message: ChatMessage;
  onFeedback?: (msg: ChatMessage, helpful: "yes" | "partial" | "no") => void;
  onRegenerate?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    message.feedback || null
  );
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // The original code currently in the editor + the request type, used to
  // decide whether to show the "Diff" action.
  const editorCode = useAssistantStore((s) => s.selectedCode);
  const requestType = useAssistantStore((s) => s.requestType);
  const setDiffMessageId = useAssistantStore((s) => s.setDiffMessageId);
  const setPrompt = useAssistantStore((s) => s.setPrompt);

  const codeOnly = useMemo(
    () => extractAllCode(message.content),
    [message.content]
  );

  // Show the diff button when this is a refactor response AND there's
  // original code in the editor to compare against.
  const canDiff =
    !!codeOnly &&
    !!editorCode.trim() &&
    (message.requestType === "refactor" || requestType === "refactor");

  const handleDiff = () => {
    setDiffMessageId(message.id);
  };

  // Insert this message as a new prompt — lets users branch the
  // conversation from any message. For assistant messages we use the
  // full content; for user messages we prefer the original prompt.
  const handleInsertAsPrompt = () => {
    const text =
      message.role === "user" && message.prompt
        ? message.prompt
        : message.content;
    if (!text.trim()) {
      toast.error("Nothing to insert");
      return;
    }
    setPrompt(text);
    toast.success("Inserted as new prompt");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyCode = async () => {
    if (!codeOnly) {
      toast.error("No code blocks found");
      return;
    }
    await navigator.clipboard.writeText(codeOnly);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
    toast.success("Code copied");
  };

  const handleExport = () => {
    const md = messagesToMarkdown([message], "Message");
    downloadText(
      `codementor-${message.id.slice(0, 8)}.md`,
      md,
      "text/markdown"
    );
    toast.success("Message exported");
  };

  const handleFeedback = (helpful: "yes" | "partial" | "no") => {
    setSelected(helpful);
    onFeedback?.(message, helpful);
  };

  const btns: {
    id: "yes" | "partial" | "no";
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    activeClass: string;
  }[] = [
    {
      id: "yes",
      icon: ThumbsUp,
      label: "Helpful",
      activeClass: "bg-emerald-500/15 text-emerald-600",
    },
    {
      id: "partial",
      icon: Minus,
      label: "Partial",
      activeClass: "bg-amber-500/15 text-amber-600",
    },
    {
      id: "no",
      icon: ThumbsDown,
      label: "Not helpful",
      activeClass: "bg-rose-500/15 text-rose-600",
    },
  ];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <ActionButton
        onClick={handleCopy}
        icon={copied ? Check : Copy}
        label="Copy response"
      />
      {codeOnly && (
        <ActionButton
          onClick={handleCopyCode}
          icon={copiedCode ? Check : Code2}
          label="Copy code only"
        />
      )}
      {canDiff && (
        <ActionButton onClick={handleDiff} icon={GitCompare} label="View diff" />
      )}
      <ActionButton onClick={handleExport} icon={FileDown} label="Export" />
      <ActionButton
        onClick={handleInsertAsPrompt}
        icon={CornerDownRight}
        label="Insert as new prompt"
      />
      <div className="mx-0.5 h-3 w-px bg-border" />
      {btns.map((b) => {
        const Icon = b.icon;
        const on = selected === b.id;
        return (
          <button
            key={b.id}
            onClick={() => handleFeedback(b.id)}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
              on
                ? b.activeClass
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-label={b.label}
            title={b.label}
          >
            <Icon className="h-3 w-3" />
          </button>
        );
      })}
      {onRegenerate && (
        <>
          <div className="mx-0.5 h-3 w-px bg-border" />
          <ActionButton onClick={onRegenerate} icon={RefreshCw} label="Regenerate" />
        </>
      )}
    </div>
  );
}

function MessageBubbleImpl({
  message,
  onFeedback,
  onRegenerate,
  isStreaming,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const empty = !message.content;

  const stats = useMemo(
    () => (isUser || empty ? null : countStats(message.content)),
    [message.content, isUser, empty]
  );
  const codeBlocks = useMemo(
    () => (isUser ? 0 : (message.content.match(/```/g) || []).length / 2),
    [message.content, isUser]
  );

  const timeStr = useMemo(() => {
    if (!message.createdAt) return "";
    return new Date(message.createdAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.createdAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar with gradient ring */}
      <div
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
          isUser
            ? "border-border bg-muted text-muted-foreground"
            : "border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        {isStreaming && !isUser && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-background bg-emerald-500" />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 max-w-[calc(100%-2.75rem)] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Meta row */}
        <div className="mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {isUser ? "You" : "CodeMentor AI"}
          </span>
          {message.requestType && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              {message.requestType}
            </span>
          )}
          {timeStr && (
            <span className="flex items-center gap-0.5 text-muted-foreground/70">
              <Clock className="h-2.5 w-2.5" />
              {timeStr}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 shadow-sm transition-shadow",
            isUser
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-card hover:shadow-md",
            isStreaming && !isUser && "ring-1 ring-emerald-500/30"
          )}
        >
          {empty && isStreaming ? (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium">Thinking...</span>
              <span className="text-muted-foreground/60">
                Analyzing your request
              </span>
            </div>
          ) : empty ? (
            <p className="text-xs text-muted-foreground italic">
              (empty response)
            </p>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {message.content}
            </p>
          ) : (
            <div className="relative">
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-emerald-500 align-middle" aria-hidden />
              )}
            </div>
          )}
        </div>

        {/* Stats row (assistant only, when not streaming) */}
        {!isUser && !empty && !isStreaming && stats && (
          <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground/70">
            <span className="flex items-center gap-0.5" title="Words">
              <Hash className="h-2.5 w-2.5" />
              {stats.words}w
            </span>
            <span title="Tokens">~{stats.tokens} tok</span>
            {codeBlocks > 0 && (
              <span className="flex items-center gap-0.5" title="Code blocks">
                <Code2 className="h-2.5 w-2.5" />
                {codeBlocks}
              </span>
            )}
          </div>
        )}

        {!isUser && !empty && !isStreaming && (
          <FeedbackBar
            message={message}
            onFeedback={onFeedback}
            onRegenerate={isLast ? onRegenerate : undefined}
          />
        )}
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
