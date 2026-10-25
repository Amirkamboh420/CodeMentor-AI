"use client";

import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ClipboardPaste } from "lucide-react";
import { useTheme } from "next-themes";
import { useAssistantStore } from "@/store/assistant-store";
import { toast } from "sonner";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({
  language,
  value,
  isDark,
}: {
  language: string;
  value: string;
  isDark: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const setSelectedCode = useAssistantStore((s) => s.setSelectedCode);
  const setFileType = useAssistantStore((s) => s.setFileType);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const handleInsert = useCallback(() => {
    setSelectedCode(value);
    // If the language is a known file type, switch the editor to it
    const knownTypes = [
      "typescript",
      "tsx",
      "javascript",
      "jsx",
      "python",
      "sql",
      "go",
      "rust",
      "json",
      "yaml",
      "bash",
    ];
    if (knownTypes.includes(language)) {
      setFileType(language);
    }
    toast.success("Inserted into editor");
  }, [value, language, setSelectedCode, setFileType]);

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/40">
      {/* Subtle top border gradient (emerald → teal → transparent) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"
      />
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {language || "code"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleInsert}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Insert into editor"
            title="Insert into editor"
          >
            <ClipboardPaste className="h-3 w-3" />
            <span className="hidden sm:inline">Insert</span>
          </button>
          <div className="h-3 w-px bg-border" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language || "typescript"}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "0.875rem 1rem",
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-geist-mono), monospace" },
        }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <div
      className={
        "max-w-none text-sm leading-relaxed " + (className || "")
      }
    >
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            const isInline = !match && !text.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={match ? match[1] : ""}
                value={text}
                isDark={isDark}
              />
            );
          },
          a({ children, ...props }) {
            return (
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
                {...props}
              >
                {children}
              </a>
            );
          },
          h1: ({ children }) => (
            <h1 className="mt-5 mb-2 text-lg font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-base font-semibold border-b border-border pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1.5 text-sm font-semibold text-foreground">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="my-1.5 ml-5 list-disc space-y-0.5 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 ml-5 list-decimal space-y-0.5 text-sm">
              {children}
            </ol>
          ),
          p: ({ children }) => (
            <p className="my-1.5 text-sm leading-relaxed">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-primary/40 bg-muted/40 px-3 py-1.5 text-sm italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted/60 px-3 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-1.5">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
