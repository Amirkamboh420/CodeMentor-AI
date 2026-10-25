"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Gauge,
  Shapes,
  ShieldAlert,
  ChevronRight,
  Lightbulb,
  Code2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_BASE,
  type KBItem,
} from "@/lib/knowledge-base";
import { MarkdownRenderer } from "@/components/assistant/markdown-renderer";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shapes,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Gauge,
  ShieldAlert,
};

export function KnowledgePanel() {
  const [active, setActive] = useState(KNOWLEDGE_BASE[0].id);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const section = useMemo(
    () => KNOWLEDGE_BASE.find((s) => s.id === active) || KNOWLEDGE_BASE[0],
    [active]
  );

  const filtered: KBItem[] = useMemo(() => {
    if (!query.trim()) return section.items;
    const q = query.toLowerCase();
    return section.items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q) ||
        it.details.toLowerCase().includes(q) ||
        (it.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [section, query]);

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-border p-1.5">
        {KNOWLEDGE_BASE.map((s) => {
          const Icon = ICONS[s.icon] || Lightbulb;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActive(s.id);
                setOpenId(null);
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={s.label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="leading-tight">{s.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${section.label.toLowerCase()}...`}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
          {section.description}
        </p>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No matches.
            </p>
          ) : (
            filtered.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-card transition-colors",
                    isOpen ? "border-primary/40" : "border-border"
                  )}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-start gap-2 p-2.5 text-left"
                  >
                    <ChevronRight
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-90"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-snug">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {item.summary}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.tags.map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="h-4 px-1 text-[9px] font-normal"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                      {item.details && (
                        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                          {item.details}
                        </p>
                      )}
                      {item.code && (
                        <div className="mt-2">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            <Code2 className="h-3 w-3" /> Example
                          </div>
                          <MarkdownRenderer
                            content={"```" + (item.language || "") + "\n" + item.code + "\n```"}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
