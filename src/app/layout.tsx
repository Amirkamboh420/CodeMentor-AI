import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { ensureDefaultAdmin } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeMentor AI — Expert Code Assistant",
  description:
    "Production-grade AI code assistant for generating, refactoring, explaining, and debugging code. Security-first, knowledge-backed, streaming responses.",
  keywords: [
    "AI code assistant",
    "CodeMentor",
    "code generation",
    "refactoring",
    "debugging",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CodeMentor AI",
    description: "Expert AI code assistant — generate, refactor, explain, debug",
    siteName: "CodeMentor AI",
    type: "website",
  },
};

// Seed default admin on server start
ensureDefaultAdmin().catch(console.error);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors position="bottom-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
