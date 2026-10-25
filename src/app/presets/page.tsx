"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bookmark, Plus, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PresetsManager } from "@/components/assistant/presets-manager";
import { useAssistantStore } from "@/store/assistant-store";

/**
 * /presets - dedicated full-page route for the prompt presets manager.
 *
 * Renders the PresetsManager dialog (auto-opened on mount via the store's
 * `presetsOpen` flag). If the dialog is closed, the user sees a friendly
 * placeholder with a re-open button.
 */
export default function PresetsPage() {
  const presetsOpen = useAssistantStore((s) => s.presetsOpen);
  const setPresetsOpen = useAssistantStore((s) => s.setPresetsOpen);

  // Auto-open the presets dialog on mount so the navbar link immediately
  // surfaces the presets content.
  useEffect(() => {
    setPresetsOpen(true);
  }, [setPresetsOpen]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Prompt presets
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reusable prompt templates. Apply one to the assistant, or
                create new presets for common workflows.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/assistant">
                <ArrowRight className="h-4 w-4" />
                Open assistant
              </Link>
            </Button>
            <Button onClick={() => setPresetsOpen(true)}>
              <Plus className="h-4 w-4" />
              Browse presets
            </Button>
          </div>
        </div>

        {/* Inline quick-info card shown when the dialog is closed. */}
        {!presetsOpen && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Presets manager</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  Closed
                </Badge>
              </div>
              <CardDescription>
                The presets manager is currently closed. Click below to open it
                again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setPresetsOpen(true)}>
                <Bookmark className="h-4 w-4" />
                Open manager
              </Button>
            </CardContent>
          </Card>
        )}

        {/* The dialog itself — reads its open state from the store. */}
        <PresetsManager />
      </div>
    </AppLayout>
  );
}
