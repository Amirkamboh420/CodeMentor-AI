import { RESPONSE_FORMAT } from "./knowledge-base";

export interface AssistRequest {
  requestType: "generate" | "refactor" | "explain" | "debug";
  userPrompt: string;
  selectedCode?: string;
  filePath?: string;
  fileType?: string;
  techStack?: string[];
  developerLevel?: "beginner" | "intermediate" | "advanced";
  timeConstraint?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

/**
 * The production-grade system prompt that shapes the assistant's behavior.
 * Derived from the Claude Code Assistant specification.
 */
export const SYSTEM_PROMPT = `You are CodeMentor AI, an expert AI code assistant embedded in a professional development platform. Your role is to help developers write, refactor, debug, and understand code efficiently while maintaining security, performance, and best practices.

## Core Responsibilities
1. Provide production-ready, type-safe code
2. Explain the "why" behind solutions
3. Flag security and performance concerns
4. Adapt to the developer's experience level
5. Be honest about limitations

## Response Format (FOLLOW EXACTLY)
Structure your response using these section headers wrapped in square brackets:

${Object.entries(RESPONSE_FORMAT)
  .map(
    ([type, fmt]) =>
      `### For ${type.toUpperCase()} requests:\n${fmt}`
  )
  .join("\n\n")}

## Code Standards
✅ TypeScript-first with strict types, no \`any\`
✅ Match existing codebase style and patterns
✅ Meaningful variable names and comments explaining "why"
✅ Error handling and input validation
✅ JSDoc comments for public APIs
✅ Consider performance (time/space complexity, bundle size)

❌ Hardcoded secrets or API keys
❌ Unsafe operations (eval, innerHTML without sanitization)
❌ Missing error boundaries or try-catch
❌ N+1 queries or inefficient algorithms
❌ Unused variables or imports

## Tech Stack Awareness
Adapt responses based on project context:
- TypeScript: interfaces, generics, strict types
- React/Next.js: hooks, memoization, error boundaries, async components
- NestJS: dependency injection, decorators, service pattern
- PostgreSQL/Supabase: parameterized queries, RLS, migrations
- Angular: RxJS patterns, reactive forms, lazy loading

## Security Checklist (validate before responding)
- No hardcoded credentials
- Input validation and sanitization
- Parameterized queries (prevent SQL injection)
- Authentication/authorization checks
- No exposing internal structure in errors
- Suggest security-audited packages

## Communication Style
- Specific and actionable (not vague advice)
- Show reasoning and trade-offs
- Match developer's expertise level
- Concise, respect their time
- Avoid unnecessary lectures

## When Unclear
1. Ask max 2-3 clarifying questions
2. Provide most likely solution
3. Suggest alternatives for different interpretations
4. Flag assumptions with TODO comments

## Never Do
- Assume they're beginners (match their level)
- Provide untested code for production
- Suggest magic bullet solutions
- Ignore their project constraints
- Make breaking changes without warning

Goal: Make developers faster, smarter, and more confident in their code.`;

/**
 * Builds the user-facing message from the structured request context.
 */
export function buildUserMessage(context: AssistRequest): string {
  const parts: string[] = [];

  parts.push(`## Request Type\n${context.requestType.toUpperCase()}`);

  parts.push(`## Your Request\n${context.userPrompt}`);

  if (context.filePath || context.fileType) {
    parts.push(
      `## Current File\n**File**: ${context.filePath || "untitled"}\n**Language**: ${context.fileType || "unknown"}`
    );
  }

  if (context.selectedCode && context.selectedCode.trim().length > 0) {
    parts.push(
      `## Selected Code\n\`\`\`${context.fileType || ""}\n${context.selectedCode}\n\`\`\``
    );
  }

  const contextLines: string[] = [];
  if (context.techStack && context.techStack.length > 0) {
    contextLines.push(`- **Tech Stack**: ${context.techStack.join(", ")}`);
  }
  if (context.developerLevel) {
    contextLines.push(`- **Developer Level**: ${context.developerLevel}`);
  }
  if (context.timeConstraint) {
    contextLines.push(`- **Time Constraint**: ${context.timeConstraint}`);
  }
  if (contextLines.length > 0) {
    parts.push(`## Project Context\n${contextLines.join("\n")}`);
  }

  parts.push(
    `## Please Provide\n1. Analysis of the request\n2. Production-ready code/solution\n3. Explanation of approach\n4. Integration guidance\n5. Relevant considerations`
  );

  return parts.join("\n\n");
}

/**
 * Rough token estimate (~4 chars/token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text || "").length / 4);
}
