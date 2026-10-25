import * as React from "react";
import { Navbar } from "./navbar";
import { SiteFooter } from "./site-footer";

/**
 * AppLayout: shared wrapper for authenticated pages (dashboard, settings,
 * admin). It renders a sticky Navbar at the top, the page content (flex-1)
 * in the middle, and a SiteFooter pinned to the bottom via `mt-auto`.
 *
 * The landing page and auth pages use their own layout and do not use this.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
