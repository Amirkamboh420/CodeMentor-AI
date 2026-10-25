"use client";

import { useState } from "react";
import {
  ChevronDown,
  Code2,
  Layers,
  Clock,
  Gauge,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TECH_STACKS,
  FILE_TYPES,
} from "@/lib/knowledge-base";
import { useAssistantStore } from "@/store/assistant-store";
import { cn } from "@/lib/utils";

export function ContextBar() {
  const {
    techStack,
    toggleTech,
    developerLevel,
    setDeveloperLevel,
    fileType,
    setFileType,
    filePath,
    setFilePath,
    timeConstraint,
    setTimeConstraint,
  } = useAssistantStore();

  const [open, setOpen] = useState(false);

  const activeCount =
    (techStack.length > 0 ? 1 : 0) +
    (fileType ? 1 : 0) +
    (timeConstraint ? 1 : 0) +
    (developerLevel !== "intermediate" ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Context
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1 text-[10px]"
              >
                {activeCount}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 p-0"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold">Project Context</p>
            <p className="text-[10px] text-muted-foreground">
              Shape the assistant's response
            </p>
          </div>

          {/* Tech stack */}
          <div className="space-y-1.5 border-b border-border px-3 py-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3 w-3" /> Tech Stack
            </Label>
            <div className="flex flex-wrap gap-1">
              {TECH_STACKS.map((t) => {
                const on = techStack.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTech(t)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File type + path */}
          <div className="space-y-2 border-b border-border px-3 py-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Code2 className="h-3 w-3" /> File
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="path/to/file.ts"
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>

          {/* Developer level */}
          <div className="space-y-2 border-b border-border px-3 py-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Gauge className="h-3 w-3" /> Developer Level
            </Label>
            <div className="grid grid-cols-3 gap-1">
              {(["beginner", "intermediate", "advanced"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setDeveloperLevel(l)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] capitalize transition-colors",
                    developerLevel === l
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Time constraint */}
          <div className="space-y-2 px-3 py-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3 w-3" /> Time Constraint
            </Label>
            <div className="flex gap-1">
              <Input
                value={timeConstraint}
                onChange={(e) => setTimeConstraint(e.target.value)}
                placeholder="e.g. quick fix, MVP, production"
                className="h-8 text-xs"
              />
              {timeConstraint && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setTimeConstraint("")}
                  aria-label="Clear time constraint"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick chips */}
      {techStack.slice(0, 3).map((t) => (
        <Badge
          key={t}
          variant="outline"
          className="h-7 gap-1 px-2 text-[10px] font-normal"
        >
          {t}
        </Badge>
      ))}
      {techStack.length > 3 && (
        <Badge variant="outline" className="h-7 px-2 text-[10px]">
          +{techStack.length - 3}
        </Badge>
      )}
      <Separator orientation="vertical" className="h-5" />
      <Badge
        variant="outline"
        className="h-7 gap-1 px-2 text-[10px] font-normal"
      >
        <Code2 className="h-3 w-3" />
        {FILE_TYPES.find((f) => f.value === fileType)?.label || fileType}
      </Badge>
      {developerLevel !== "intermediate" && (
        <Badge
          variant="outline"
          className="h-7 gap-1 px-2 text-[10px] font-normal capitalize"
        >
          <Gauge className="h-3 w-3" />
          {developerLevel}
        </Badge>
      )}
    </div>
  );
}
