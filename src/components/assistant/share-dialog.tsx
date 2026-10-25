"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  Link2,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAssistantStore, type ChatMessage } from "@/store/assistant-store";
import { buildShareUrl, type ShareableConversation } from "@/lib/share-utils";
import { messagesToMarkdown } from "@/lib/conversation-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ShareDialog() {
  const open = useAssistantStore((s) => s.shareOpen);
  const setOpen = useAssistantStore((s) => s.setShareOpen);
  const messages = useAssistantStore((s) => s.messages);
  const conversationId = useAssistantStore((s) => s.conversationId);
  const requestType = useAssistantStore((s) => s.requestType);

  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const shareData = useMemo<ShareableConversation | null>(() => {
    if (messages.length === 0) return null;
    return {
      title:
        (messages[0]?.role === "user"
          ? messages[0].content.slice(0, 60)
          : "Shared conversation") || "Shared conversation",
      requestType,
      messages: messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
        requestType: m.requestType,
        createdAt: m.createdAt,
      })),
      createdAt: Date.now(),
    };
  }, [messages, requestType]);

  const shareUrl = useMemo(() => {
    if (!shareData) return "";
    return buildShareUrl(shareData);
  }, [shareData]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Share link copied to clipboard");
  }, [shareUrl]);

  const handleOpenInNewTab = useCallback(() => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  // Copy the conversation as Markdown text — useful for very long
  // conversations that would exceed URL length limits.
  const handleCopyMarkdown = useCallback(async () => {
    if (!shareData) return;
    const md = messagesToMarkdown(
      shareData.messages.map((m) => ({
        role: m.role,
        content: m.content,
        requestType: m.requestType,
        createdAt: m.createdAt,
      })),
      shareData.title
    );
    await navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
    toast.success("Markdown copied to clipboard");
  }, [shareData]);

  // Reset copied states when dialog closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
      setCopiedMd(false);
    }
  }, [open]);

  const messageCount = shareData?.messages.length ?? 0;
  const urlLength = shareUrl.length;
  const tooLong = urlLength > 8000; // some browsers cap URL length ~8k-32k

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Share2 className="h-4 w-4 text-emerald-500" />
            Share Conversation
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Generate a read-only link to this conversation. The link encodes
            the full conversation in the URL — no server storage needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Summary */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <Badge variant="secondary" className="text-[9px] uppercase">
              {shareData?.requestType || "generate"}
            </Badge>
            <span className="line-clamp-1 flex-1 text-xs font-medium">
              {shareData?.title}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {messageCount} msg{messageCount === 1 ? "" : "s"}
            </span>
          </div>

          {tooLong && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
              ⚠️ This conversation is large ({urlLength.toLocaleString()}{" "}
              characters). Some browsers may truncate the URL. Consider
              exporting as Markdown instead.
            </div>
          )}

          {/* URL field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="h-9 pl-8 pr-20 font-mono text-[11px]"
                  placeholder="No conversation to share"
                />
                <button
                  onClick={handleCopy}
                  disabled={!shareUrl}
                  className={cn(
                    "absolute right-1 top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded px-2 text-[10px] font-medium transition-colors",
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <X className="h-3 w-3" />
              Link expires only if the conversation changes
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-[11px] text-muted-foreground"
                onClick={handleCopyMarkdown}
                disabled={!shareData}
                title="Copy conversation as Markdown text (for long conversations)"
              >
                {copiedMd ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {copiedMd ? "Copied" : "Markdown"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-[11px]"
                onClick={handleOpenInNewTab}
                disabled={!shareUrl}
              >
                <ExternalLink className="h-3 w-3" />
                Open in new tab
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
