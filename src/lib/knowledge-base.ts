// Knowledge base data extracted from the Claude Code Assistant system prompt.
// Used to render the reference panel in the UI.

export interface KBItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  code?: string;
  language?: string;
  tags?: string[];
}

export interface KBSection {
  id: string;
  label: string;
  icon: string;
  description: string;
  items: KBItem[];
}

export const REQUEST_TYPES = [
  {
    id: "generate",
    label: "Generate",
    description: "Create new code from a high-level spec",
    icon: "Sparkles",
    color: "emerald",
  },
  {
    id: "refactor",
    label: "Refactor",
    description: "Improve existing code structure & quality",
    icon: "Wand2",
    color: "violet",
  },
  {
    id: "explain",
    label: "Explain",
    description: "Break down how code works step by step",
    icon: "Brain",
    color: "amber",
  },
  {
    id: "debug",
    label: "Debug",
    description: "Find root cause and fix issues",
    icon: "Bug",
    color: "rose",
  },
] as const;

export const TECH_STACKS = [
  "React 18",
  "Next.js 16",
  "TypeScript",
  "Tailwind CSS",
  "NestJS",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Prisma",
  "Supabase",
  "Angular",
  "Vue 3",
  "Python",
  "Go",
] as const;

export const FILE_TYPES = [
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "TSX (React)" },
  { value: "javascript", label: "JavaScript" },
  { value: "jsx", label: "JSX (React)" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "bash", label: "Shell" },
] as const;

export const KNOWLEDGE_BASE: KBSection[] = [
  {
    id: "patterns",
    label: "Request Patterns",
    icon: "Shapes",
    description: "Common developer request patterns and how the assistant handles them.",
    items: [
      {
        id: "p1",
        title: '"I have this code, make it better"',
        summary: "Vague improvement request.",
        details:
          'Detection: No specific request type, multiple issues apparent. Ask 1-2 clarifying questions (performance? readability? both?), provide the most impactful optimization, and suggest alternatives for other interpretations.',
        tags: ["vague", "improve"],
      },
      {
        id: "p2",
        title: '"Copy-paste from Stack Overflow, doesn\'t work"',
        summary: "Inconsistent style + syntax errors.",
        details:
          "Code style is inconsistent with the project, syntax errors present. Explain what's wrong, fix for their tech stack, show how to adapt SO solutions (validate, check versions), and suggest prevention via code review & linting.",
        tags: ["debug", "legacy"],
      },
      {
        id: "p3",
        title: '"My code works but I don\'t understand it"',
        summary: "Explain working code.",
        details:
          "Request type = explain, no issue stated. Provide executive summary (one sentence), break down logic step-by-step, show input/output with a real example, flag common misconceptions, and suggest when/why to use this pattern.",
        tags: ["explain"],
      },
      {
        id: "p4",
        title: '"We need to optimize for production"',
        summary: "Scale/latency keywords detected.",
        details:
          'Keywords: "scale", "million", "200ms", "concurrent". Profile the bottleneck (CPU, I/O, memory?), provide benchmarked improvements, show trade-offs, include pagination/caching/indexing suggestions, and provide monitoring code.',
        tags: ["performance", "production"],
      },
      {
        id: "p5",
        title: '"Generate code from scratch"',
        summary: "High-level requirements, no code.",
        details:
          "Selected code is empty, clear spec provided. Ask 1 clarifying question if critical, generate production-ready well-documented code, include a working example/usage, suggest related patterns, and flag assumptions with TODO.",
        tags: ["generate"],
      },
    ],
  },
  {
    id: "edge-cases",
    label: "Edge Cases",
    icon: "AlertTriangle",
    description: "Tricky scenarios and the safe way to handle them.",
    items: [
      {
        id: "e1",
        title: "Conflicting Requirements",
        summary: '"Make it faster AND more readable"',
        details:
          "These can conflict. Provide Approach 1 (prioritize speed with comments explaining tricks) and Approach 2 (prioritize readability with reasonable performance), then give a recommendation based on the call frequency and team needs.",
        tags: ["conflict"],
      },
      {
        id: "e2",
        title: "Security vs Usability",
        summary: "Store password as plaintext for debugging",
        details:
          "ALWAYS REFUSE. This is a security vulnerability. Provide secure alternatives: logging systems that hash sensitive data, test users with test passwords, local environment variables, shadow traffic/staging databases. Never compromise security for convenience.",
        tags: ["security", "block"],
      },
      {
        id: "e3",
        title: "Legacy Code + Modern Patterns",
        summary: "Refactor jQuery to React",
        details:
          "Provide a migration path: Phase 1 create isolated React component jQuery can mount, Phase 2 replace jQuery features one-by-one, Phase 3 full React application. Don't rewrite everything at once, keep tests passing after each phase, use Webpack/Vite for gradual migration.",
        tags: ["migration", "legacy"],
      },
      {
        id: "e4",
        title: '"I don\'t know what I\'m building"',
        summary: "Vague requirements.",
        details:
          "Ask for: 1) the problem being solved (for whom), 2) timeline (MVP vs production), 3) scale (10 users or 1M?). Provide a starter scaffold they can build on, then refine once they clarify.",
        tags: ["vague"],
      },
      {
        id: "e5",
        title: "Mixed Languages in One Snippet",
        summary: "TS, JS, Python, SQL all mixed.",
        details:
          "Identify primary language from file path, ask which language it's in, provide all in primary language + show SQL/Python separately, and suggest abstracting to properly typed interfaces.",
        tags: ["mixed"],
      },
      {
        id: "e6",
        title: "Incomplete Code Snippets",
        summary: "Missing imports / abrupt endings.",
        details:
          "State assumptions explicitly (imports, return types, error handling), complete the code with assumptions called out, and ask the user to provide the full snippet if assumptions are incorrect.",
        tags: ["incomplete"],
      },
      {
        id: "e7",
        title: "Code Golf / Over-compression",
        summary: '"Make this 500-char function into 10 lines"',
        details:
          "Classic micro-optimization that's too clever. Provide a readable version with the same performance, show benchmark + assembly inspection for genuine peak performance, and remind that compiler optimizations are smarter than humans — focus on algorithm choices.",
        tags: ["performance", "readability"],
      },
    ],
  },
  {
    id: "security",
    label: "Security Checklist",
    icon: "ShieldCheck",
    description: "Validate every response against this checklist before sending.",
    items: [
      {
        id: "s1",
        title: "No Hardcoded Secrets",
        summary: "No API keys, passwords, or tokens.",
        details: "Never embed credentials in source. Reference process.env or config files instead. Audit for accidental commits of .env contents.",
        tags: ["secrets"],
      },
      {
        id: "s2",
        title: "No Unsafe eval / innerHTML",
        summary: "No eval() or unsanitized innerHTML.",
        details: "Avoid eval() and innerHTML without sanitization. Use safe parsers and a sanitizer like DOMPurify for any user-supplied markup.",
        tags: ["xss"],
      },
      {
        id: "s3",
        title: "Input Validated",
        summary: "All user input checked.",
        details: "Validate type, length, and format on every public-facing input. Use Zod / Joi / class-validator. Never trust client-side validation alone.",
        tags: ["validation"],
      },
      {
        id: "s4",
        title: "SQL Injection Free",
        summary: "Parameterized queries only.",
        details: "Never concatenate user input into SQL strings. Use parameterized/prepared statements or a query builder.",
        code: `// ❌ Vulnerable
db.query(\`SELECT * FROM users WHERE name='\${name}'\`);

// ✅ Parameterized
db.query('SELECT * FROM users WHERE name=$1', [name]);`,
        language: "typescript",
        tags: ["sql"],
      },
      {
        id: "s5",
        title: "No Exposed PII",
        summary: "No console.log of user data.",
        details: "Never log emails, passwords, tokens, or PII. Mask sensitive fields in log payloads.",
        tags: ["pii"],
      },
      {
        id: "s6",
        title: "Authentication Present",
        summary: "Protected routes & endpoints.",
        details: "Ensure protected routes/endpoints have auth checks. Don't expose user IDs in URLs; use secure token storage (httpOnly cookies over localStorage).",
        tags: ["auth"],
      },
      {
        id: "s7",
        title: "Rate Limiting Kept",
        summary: "Don't remove security measures.",
        details: "When refactoring, preserve rate limiting, CSRF protection, and other middleware. Flag explicitly if a change weakens them.",
        tags: ["ratelimit"],
      },
      {
        id: "s8",
        title: "Dependencies Safe",
        summary: "No known CVEs in packages.",
        details: "Suggest security-audited packages, flag outdated packages with known CVEs, recommend peer dependencies explicitly. Run `bun audit` regularly.",
        tags: ["deps"],
      },
      {
        id: "s9",
        title: "Error Handling Present",
        summary: "Handles all failure paths.",
        details: "Never silently fail. Throw/return errors explicitly with meaningful messages and recovery strategies. Validate inputs for public functions.",
        tags: ["errors"],
      },
      {
        id: "s10",
        title: "HTTPS Recommended",
        summary: "Encrypt sensitive data in transit.",
        details: "Always recommend HTTPS for sensitive data transport. Reject plaintext protocols for credentials.",
        tags: ["https"],
      },
    ],
  },
  {
    id: "mistakes",
    label: "Common Mistakes",
    icon: "AlertOctagon",
    description: "Developer mistakes to warn about.",
    items: [
      {
        id: "m1",
        title: "N+1 Query Problem",
        summary: "One DB query per loop iteration.",
        details: "Fetching related rows inside a loop causes N+1 queries. Batch-fetch with IN/ANY clauses or use JOINs.",
        code: `// ❌ Wrong: queries DB once per user
for (const user of users) {
  const posts = await db.query(
    'SELECT * FROM posts WHERE user_id = ?', [user.id]
  );
}

// ✅ Right: single batched query
const posts = await db.query(
  'SELECT * FROM posts WHERE user_id = ANY($1)',
  [userIds]
);`,
        language: "typescript",
        tags: ["database", "performance"],
      },
      {
        id: "m2",
        title: "Missing Key in React Lists",
        summary: "Using array index as key.",
        details: "Index keys break when items reorder/insert. Use a stable unique id from the data.",
        code: `{items.map((item, index) => <Item key={index} />)}   // ❌
{items.map((item) => <Item key={item.id} />)}        // ✅`,
        language: "tsx",
        tags: ["react"],
      },
      {
        id: "m3",
        title: "Race Conditions in Async",
        summary: "Stale responses overwrite fresh ones.",
        details: "When the user types fast, earlier API responses can resolve after later ones. Use AbortController to cancel in-flight requests.",
        code: `// ✅ Abortable fetch
const controller = new AbortController();
const res = await fetch(url, { signal: controller.signal });
// On new query: controller.abort()`,
        language: "typescript",
        tags: ["async", "react"],
      },
      {
        id: "m4",
        title: "Infinite useEffect Loop",
        summary: "Missing dependency array.",
        details: "useEffect with no dependency array runs after every render. Always specify deps, and avoid putting unstable objects in the array.",
        code: `// ❌ Runs every render
useEffect(() => { fetchData(); });

// ✅ Runs only when userId changes
useEffect(() => { fetchData(); }, [userId]);`,
        language: "tsx",
        tags: ["react", "hooks"],
      },
      {
        id: "m5",
        title: "Mutating State Directly",
        summary: "Modifying state object in place.",
        details: "React relies on reference changes to detect updates. Always return a new object/array from the setter.",
        code: `// ❌ Mutated
const u = { ...state.user };
u.name = 'John';
setState({ user: u });

// ✅ Immutable
setState((p) => ({ user: { ...p.user, name: 'John' } }));`,
        language: "typescript",
        tags: ["react", "state"],
      },
    ],
  },
  {
    id: "performance",
    label: "Performance Anti-Patterns",
    icon: "Gauge",
    description: "Patterns that silently hurt performance.",
    items: [
      {
        id: "pf1",
        title: "Inline Functions in Render",
        summary: "New function identity each render.",
        details: "Passing arrow functions inline causes child components to re-render every time. Wrap with useCallback.",
        code: `// ❌ New fn every render
<Child onClick={() => handleClick(id)} />

// ✅ Memoized
const cb = useCallback(() => handleClick(id), [id]);
<Child onClick={cb} />`,
        language: "tsx",
        tags: ["react", "render"],
      },
      {
        id: "pf2",
        title: "Object Literals as Props",
        summary: "New object every render.",
        details: "Passing inline objects breaks referential equality. Memoize with useMemo.",
        code: `// ❌ New object every render
<Child style={{ color: 'red' }} />

// ✅ Stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<Child style={style} />`,
        language: "tsx",
        tags: ["react", "render"],
      },
      {
        id: "pf3",
        title: "Large Packages for Small Needs",
        summary: "50KB for one function.",
        details: "Importing moment for one date format pulls the whole locale set. Use native APIs or tree-shakeable alternatives like date-fns.",
        code: `// ❌ 50KB for one function
import moment from 'moment';

// ✅ Tree-shakeable
import { formatISO } from 'date-fns';
// or native
new Date().toISOString();`,
        language: "typescript",
        tags: ["bundle"],
      },
      {
        id: "pf4",
        title: "Synchronous Computation in Render",
        summary: "Blocks the main thread.",
        details: "Sorting large arrays during render freezes the UI. Memoize expensive computation and run it only when inputs change.",
        code: `// ❌ Runs every render
const sorted = data.sort((a, b) => a.v - b.v);

// ✅ Memoized
const sorted = useMemo(
  () => [...data].sort((a, b) => a.v - b.v),
  [data]
);`,
        language: "tsx",
        tags: ["react", "render"],
      },
    ],
  },
  {
    id: "escalation",
    label: "Escalation",
    icon: "ShieldAlert",
    description: "When to flag for human review.",
    items: [
      {
        id: "esc1",
        title: "Don't Handle Alone",
        summary: "Needs expert review.",
        details:
          "Architecture decisions (need full context), security/compliance reviews, database migrations (need rollback plan), payment processing (compliance), authentication systems (security audit).",
        tags: ["review"],
      },
      {
        id: "esc2",
        title: "Flag for Review",
        summary: "Warn the team.",
        details:
          "Use ⚠️ SECURITY REVIEW NEEDED for OAuth/compliance, ⚠️ PERFORMANCE IMPACT for critical-path changes, ⚠️ BREAKING CHANGE for data migrations.",
        tags: ["review", "warn"],
      },
    ],
  },
];

// Quick-start prompt templates per request type
export const PROMPT_TEMPLATES: Record<string, string[]> = {
  generate: [
    "Create a reusable debounce hook in TypeScript with cleanup",
    "Generate a paginated data table component using shadcn/ui",
    "Create a Zod schema for a user registration form",
    "Generate a custom hook for managing form state with validation",
  ],
  refactor: [
    "This component re-renders too often, optimize it",
    "Simplify this deeply nested callback chain",
    "Convert this class component to hooks",
    "Extract reusable logic from this component",
  ],
  explain: [
    "Explain how this useReducer setup works",
    "What does this closure capture and why?",
    "Walk through the lifecycle of this useEffect",
    "Explain the difference between useMemo and useCallback",
  ],
  debug: [
    "This async function sometimes returns undefined",
    "State updates aren't reflected in the UI",
    "Getting a hydration mismatch error",
    "useEffect runs in an infinite loop",
  ],
};

export const RESPONSE_FORMAT = {
  generate: `[BRIEF ANALYSIS]
1-2 sentence summary of what's being built.

[CODE BLOCK]
Production-ready code with formatting and comments.

[EXPLANATION]
- What this does
- Key decision rationale
- Edge cases handled
- Performance considerations

[USAGE]
How to integrate this into the project.

[CONSIDERATIONS]
- Dependencies needed
- Potential issues to watch for
- Alternative approaches`,
  refactor: `[CURRENT ISSUES]
- Issue 1: Explanation
- Issue 2: Explanation

[REFACTORED CODE]
Improved version with inline comments.

[WHY THIS IS BETTER]
- Performance improvement
- Readability enhancement
- Maintainability gains
- Standards alignment

[MIGRATION PATH]
Step-by-step how to apply this.`,
  explain: `[EXECUTIVE SUMMARY]
What it does in one sentence.

[HOW IT WORKS]
Step-by-step breakdown.

[PRACTICAL EXAMPLE]
Real usage scenario with input/output.

[COMMON PITFALLS]
Things developers often get wrong.

[WHEN TO USE]
Appropriate use cases and alternatives.`,
  debug: `[ROOT CAUSE]
What's actually wrong and why.

[THE FIX]
Code change with highlighted modifications.

[VERIFICATION]
How to test that the bug is fixed.

[PREVENTION]
How to avoid this in the future.`,
} as const;
