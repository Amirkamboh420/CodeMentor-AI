"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FileCode2, Plus, ArrowRight } from "lucide-react";
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
import { SnippetsLibrary } from "@/components/assistant/snippets-library";
import { useAssistantStore } from "@/store/assistant-store";

/**
 * /snippets - dedicated full-page route for the snippets library.
 *
 * Renders the SnippetsLibrary dialog (auto-opened on mount via the store's
 * `snippetsOpen` flag). If the dialog is closed, the user sees a friendly
 * placeholder with a re-open button instead of a blank page.
 */
export default function SnippetsPage() {
  const snippetsOpen = useAssistantStore((s) => s.snippetsOpen);
  const setSnippetsOpen = useAssistantStore((s) => s.setSnippetsOpen);

  // Auto-open the snippets dialog on mount so the navbar link immediately
  // surfaces the library content.
  useEffect(() => {
    setSnippetsOpen(true);
  }, [setSnippetsOpen]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Snippets
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your saved code snippets. Search, edit, copy, or insert into
                the assistant editor.
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
            <Button onClick={() => setSnippetsOpen(true)}>
              <Plus className="h-4 w-4" />
              Browse snippets
            </Button>
          </div>
        </div>

        {/* Inline quick-info card shown when the dialog is closed. */}
        {!snippetsOpen && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Snippets library</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  Closed
                </Badge>
              </div>
              <CardDescription>
                The snippets library is currently closed. Click below to open
                it again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setSnippetsOpen(true)}>
                <FileCode2 className="h-4 w-4" />
                Open library
              </Button>
            </CardContent>
          </Card>
        )}

        {/* The dialog itself — reads its open state from the store. */}
        <SnippetsLibrary />
      </div>
    </AppLayout>
  );
}
