import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Zap, BookOpen, Heart } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/assistant", label: "Assistant" },
  { href: "/snippets", label: "Snippets" },
  { href: "/presets", label: "Presets" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-border bg-background/80 backdrop-blur-md">
      {/* Subtle top border gradient (emerald → teal → transparent) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {/* Left: brand */}
          <div className="space-y-3">
            <Link href="/" className="group flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span className="text-sm font-semibold transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">CodeMentor AI</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Expert AI code assistant — generate, refactor, explain, and debug
              with a knowledge-backed pair.
            </p>
          </div>

          {/* Center: quick links */}
          <nav aria-label="Footer" className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quick links
            </p>
            <ul className="flex flex-col gap-1.5">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 group-hover:w-full"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: status */}
          <div className="space-y-3 md:items-end md:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 md:flex-col md:items-end md:gap-1.5">
              <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Security-first
              </li>
              <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Streaming
              </li>
              <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                Knowledge base
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} CodeMentor AI. All rights
            reserved.
          </p>
          <p className="flex items-center gap-1">
            Built with{" "}
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> on Z.ai
          </p>
        </div>
      </div>
    </footer>
  );
}
