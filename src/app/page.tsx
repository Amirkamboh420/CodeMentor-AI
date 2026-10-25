"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Brain,
  Bug,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  BookOpen,
  Code2,
  Users,
  FileCode2,
  Globe,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Generate",
    description:
      "Create production-ready code from a high-level spec. Clean, typed, and tested.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/40",
  },
  {
    icon: Wand2,
    title: "Refactor",
    description:
      "Improve structure, readability, and performance without changing behavior.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/40",
  },
  {
    icon: Brain,
    title: "Explain",
    description:
      "Break down complex codebases step by step — perfect for onboarding.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "group-hover:border-amber-500/40",
  },
  {
    icon: Bug,
    title: "Debug",
    description:
      "Find the root cause fast. Get a minimal reproduction and a verified fix.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "group-hover:border-rose-500/40",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Describe your task",
    description:
      "Pick a request type — generate, refactor, explain, or debug — and tell the assistant what you need.",
  },
  {
    n: "02",
    title: "Add context",
    description:
      "Paste your code, choose your tech stack, and pick the file type. The knowledge base tailors every answer.",
  },
  {
    n: "03",
    title: "Get a complete answer",
    description:
      "Receive a streaming, structured response with a plan, code blocks, and edge cases. Save snippets as you go.",
  },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Security-first" },
  { icon: Zap, label: "Streaming responses" },
  { icon: BookOpen, label: "Built-in knowledge base" },
  { icon: Code2, label: "Multi-language support" },
];

const STATS = [
  { icon: Users, value: "10k+", label: "Developers" },
  { icon: FileCode2, value: "500k+", label: "Lines of code" },
  { icon: Globe, value: "50+", label: "Languages" },
  { icon: Sparkles, value: "4.9★", label: "Average rating" },
] as const;

const containerStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  // Authenticated users go straight to their dashboard.
  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Background grid */}
          <div
            aria-hidden
            className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
          {/* Floating emerald glow blob behind heading */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/15"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.emerald.500/10),transparent_60%)]" />

          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial="hidden"
              animate="show"
              variants={containerStagger}
            >
              <motion.div variants={fadeUp}>
                <Badge
                  variant="outline"
                  className="mb-5 gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <Sparkles className="h-3 w-3" />
                  Security-first AI code assistant
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Your AI Code{" "}
                <span className="text-gradient">Assistant</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
              >
                Generate, refactor, explain, and debug production code with an
                expert AI pair. Backed by a curated knowledge base of patterns,
                edge cases, and security checklists.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Button size="lg" asChild className="group">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Streaming responses
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Built-in knowledge base
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-b border-border bg-muted/30 py-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              {STATS.map((s) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  <s.icon className="h-5 w-5 text-emerald-500" />
                  <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Everything you need to ship
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 text-muted-foreground">
                Four modes, one assistant. Each tuned for a different developer
                workflow.
              </motion.p>
            </motion.div>
            <motion.div
              className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              {FEATURES.map((f) => (
                <motion.div key={f.title} variants={fadeUp} className="h-full">
                  <Card
                    className={`card-hover group h-full border-transparent ${f.border}`}
                  >
                    <CardContent className="space-y-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${f.bg}`}
                      >
                        <f.icon className={`h-5 w-5 ${f.color}`} />
                      </div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {f.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                How it works
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 text-muted-foreground">
                From prompt to production in three steps.
              </motion.p>
            </motion.div>

            <motion.div
              className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              {/* Connecting line on desktop */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent md:block"
              />
              {STEPS.map((s) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  className="card-hover relative rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {s.n}
                    </span>
                    <h3 className="font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-border py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerStagger}
            >
              {TRUST_ITEMS.map((t) => (
                <motion.div
                  key={t.label}
                  variants={fadeUp}
                  className="card-hover flex items-center justify-center gap-2 rounded-lg border border-border bg-card/50 p-4 text-center"
                >
                  <t.icon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">{t.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-grid relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8 shadow-[var(--shadow-glow)] sm:p-12"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-48 w-48 animate-float rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Start coding with your AI pair
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Join the platform built for serious developers. Free to
                    start — no credit card required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="lg" asChild className="group">
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
