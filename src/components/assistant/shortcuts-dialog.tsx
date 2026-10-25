"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CornerDownLeft,
  History,
  Plus,
  PanelRight,
  FileCode2,
  Sun,
  Keyboard,
  ArrowUp,
  Palette,
} from "lucide-react";
import { useAssistantStore } from "@/store/assistant-store";

const SHORTCUTS: {
  group: string;
  items: {
    keys: string[];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}[] = [
  {
    group: "Conversation",
    items: [
      {
        keys: ["⌘", "Enter"],
        label: "Send prompt",
        icon: CornerDownLeft,
      },
      { keys: ["⌘", "N"], label: "New conversation", icon: Plus },
      { keys: ["⌘", "L"], label: "Open history", icon: History },
    ],
  },
  {
    group: "Panels",
    items: [
      {
        keys: ["⌘", "P"],
        label: "Open command palette",
        icon: Palette,
      },
      { keys: ["⌘", "K"], label: "Toggle knowledge base", icon: PanelRight },
      { keys: ["⌘", "S"], label: "Open snippets library", icon: FileCode2 },
      { keys: ["?"], label: "Show this help", icon: Keyboard },
    ],
  },
  {
    group: "Interface",
    items: [
      { keys: ["⌘", "J"], label: "Toggle theme", icon: Sun },
      { keys: ["Esc"], label: "Close dialog / cancel stream", icon: ArrowUp },
    ],
  },
];

export function ShortcutsDialog() {
  const open = useAssistantStore((s) => s.shortcutsOpen);
  const setOpen = useAssistantStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Command className="h-4 w-4 text-emerald-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Speed up your workflow with these shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent"
                    >
                      <span className="flex items-center gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </span>
                      <span className="flex items-center gap-1">
                        {item.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SHORTCUTS };
