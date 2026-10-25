# Task ID: 2+3+4+5 — Projects API + Pages + VS Code Deep-Link

Agent: Main (orchestrator, full-stack)
Task: Build the core "Projects" feature for CodeMentor AI

## Scope

7 deliverables:
1. `src/app/api/projects/route.ts` (GET list + POST create)
2. `src/app/api/projects/[id]/route.ts` (GET + PATCH + DELETE, ownership-gated)
3. `src/app/api/projects/[id]/build/route.ts` (POST — simulated build)
4. `src/app/api/projects/[id]/builds/route.ts` (GET — list BuildRuns)
5. `src/app/projects/page.tsx` (Projects list page + create dialog)
6. `src/app/projects/[id]/page.tsx` (Project workspace — top bar, status flow stepper, action grid, file tree, build log panel, VS Code deep-link)
7. MODIFY `src/components/layout/navbar.tsx` (add "Projects" link with `FolderKanban` icon)

## Context reused from prior agents

- NextAuth v4 — sessions via `getServerSession(authOptions)` from `@/lib/next-auth-options`, session has `user.id`, `user.email`, `user.role`.
- RBAC helpers `isAdmin(role)` / `hasRole(role, minRole)` in `@/lib/auth`.
- Prisma client `db` from `@/lib/db`.
- Prisma models already in place: `Project`, `BuildRun`, `GitHubIntegration`, `VercelIntegration`, `NenoIntegration`. Schema was already updated by prior agent.
- AppLayout wraps Navbar + main + SiteFooter with `min-h-screen flex flex-col` + `mt-auto` footer.
- shadcn/ui components in `src/components/ui/`: button, card, dialog, badge, select, tabs, table, dropdown-menu, sheet, scroll-area, avatar, tooltip, separator, input, textarea, label, skeleton.
- Tailwind 4, dark mode via next-themes, lucide-react, framer-motion, sonner toast all installed.
- Auth pattern from `/api/conversations/*` routes: 401 if no session, 404 if not found, 403 if not owner & not admin.
- Middleware returns JSON 401 for unauthenticated `/api/*` calls (no redirect).

## Implementation notes

### API routes
- All routes use `runtime = "nodejs"` (matches other API routes).
- `GET /api/projects` filters by `userId` (admin sees all via `{}`), ordered by `updatedAt desc`, includes `_count.builds`.
- `POST /api/projects` accepts `{ name, description?, framework?, buildCommand?, outputDir? }`, stamps `userId`.
- `GET /api/projects/[id]` returns the project + last 10 builds + integration statuses (github/vercel/neno booleans).
- `PATCH` allows updating `name`, `description`, `framework`, `buildCommand`, `outputDir`, `localPath`, `envVars`, `status`, `repoUrl`, `repoFullName`, `defaultBranch`, `lastDeployUrl`, `lastBuildAt`.
- `DELETE` cascades via Prisma relations.
- `POST /api/projects/[id]/build`: creates a `BuildRun` with status `running`, sets project status to `building`, waits 3s, then 90% → `success` (project `ready`) / 10% → `failed` (project `error`). Generates a realistic mock log with emerald ANSI-free lines. Updates `lastBuildAt` on success.
- `GET /api/projects/[id]/builds`: lists all BuildRuns ordered by `createdAt desc`.

### Projects list page (`/projects`)
- Client component wrapped in `AppLayout`.
- Header with title + "New Project" button.
- Responsive grid: 1 col mobile / 2 col tablet / 3 col desktop.
- Each card: framework icon tile, name, description, status badge (color-coded), updatedAt, GitHub/Vercel connected indicators.
- Empty state with CTA.
- Create dialog: name (required), description, framework select (Next.js, React, Node.js, Static), build command (auto-filled based on framework), output dir. On submit → POST + redirect.
- Skeleton loading state.

### Project workspace page (`/projects/[id]`)
- Reads `id` param via `useParams` (no need for Suspense for the param itself).
- Top bar: editable name, framework badge, status badge, "Open in VS Code" button (deep-link), "Settings" button (dialog).
- Status flow stepper: 8 stages (Project → Development → Changes Detected → GitHub Sync → Build → Ready → Deployment → Live). Horizontal scroll on mobile. Each stage has icon + label + state (done=emerald, active=blue pulse, pending=muted).
- Action grid (responsive): 12 action buttons, each with icon + label + sublabel + loading state + disabled state when requirements missing.
- File browser panel: mock file tree (collapsible) + read-only code viewer.
- Build log panel: collapsible terminal-style panel showing latest build's log.
- VS Code deep-link: `vscode://file/{localPath}`. If no localPath, opens a dialog to set it. Tooltip on the button explains deep-link behavior.

### Navbar update
- Add `Projects` link between `Assistant` and `Snippets` using `FolderKanban` icon. Added as an object in `NAV_LINKS` array — desktop nav + mobile sheet both render.

## Post-implementation
- Run `bun run lint`.
- Append work record to `/home/z/my-project/worklog.md`.
