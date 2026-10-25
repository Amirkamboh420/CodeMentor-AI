# Task 6+7+8 — GitHub + Vercel + Neno Integrations (API + UI)

Agent: integrations (parallel build, task id 6+7+8)
Date: 2026-08-28

## Scope
Built the full third-party integration layer for "CodeMentor AI":
- GitHub connect / status / disconnect / commit-push (simulated)
- Vercel connect / status / disconnect / deploy (simulated)
- Neno/Nano connect / status / disconnect / sync (simulated)
- Shared integration-badges component for project cards + workspace
- Six dialog components with branded headers, framer-motion transitions,
  loading states, security notes, sonner toasts.

The workspace `/projects/[id]` page (built by another agent) will surface
"Connect GitHub / Connect Vercel / Connect Neno" buttons that open these
dialogs and reflect the returned status via the badges component.

## Files created

### Shared helper
1. `src/lib/integration-helpers.ts` — `requireProjectOwnership(projectId)`
   helper used by every integration route. Returns either
   `{ ok: true, project, userId, role }` or `{ ok: false, response }`.
   Also exports `mockCommitSha()`, `mockDeploymentId()`, `mockVercelUrl()`.

### GitHub (4 API + 2 UI)
2. `src/app/api/integrations/github/connect/route.ts` (POST) — upserts a
   `GitHubIntegration` (token / username / repo / branch) and mirrors repo
   metadata onto the `Project`. Validates `owner/repo` format.
3. `src/app/api/integrations/github/status/[projectId]/route.ts` (GET) —
   returns `{ connected, username, repoFullName, defaultBranch, connectedAt }`.
   Tokens are never sent to the client.
4. `src/app/api/integrations/github/disconnect/route.ts` (POST) — deletes
   the integration row.
5. `src/app/api/integrations/github/commit-push/route.ts` (POST) —
   simulated commit-push: generates a 40-char mock SHA, builds a GitHub
   commit URL, updates `project.status = "github_synced"`, returns the
   commit payload.
6. `src/components/integrations/github-connect-dialog.tsx` — branded dialog
   (Github icon header), password input for the PAT, owner/repo validation,
   default-branch field, security note, link to /settings/tokens, success
   state with emerald check.
7. `src/components/integrations/github-commit-dialog.tsx` — changed-files
   list with M/A/D colored badges, commit-message textarea with conventional
   commit hint, emerald "Commit & Push to GitHub" button, success state with
   the SHA (copyable) + "View on GitHub" link.

### Vercel (4 API + 2 UI)
8. `src/app/api/integrations/vercel/connect/route.ts` (POST) — upserts
   `VercelIntegration` (token / teamId? / vercelProjectName?).
9. `src/app/api/integrations/vercel/status/[projectId]/route.ts` (GET).
10. `src/app/api/integrations/vercel/disconnect/route.ts` (POST).
11. `src/app/api/integrations/vercel/deploy/route.ts` (POST) — simulated
    deployment: `mockDeploymentId()` + `mockVercelUrl()` (slugified project
    name → `<slug>.vercel.app`), updates `project.status = "live"` and
    `project.lastDeployUrl`.
12. `src/components/integrations/vercel-connect-dialog.tsx` — Rocket icon
    header, token + team-id + project-name fields, link to
    vercel.com/account/tokens, security note.
13. `src/components/integrations/vercel-deploy-dialog.tsx` — 5-step
    stepper (Preparing → Uploading → Building → Deploying → Live) with
    spinners on the active step, mock deploy log panel (dark terminal
    style, auto-scroll, blinking cursor), live-URL card with Copy +
    "Open Live Website" button. Retry path on error.

### Neno (4 API + 1 UI)
14. `src/app/api/integrations/neno/connect/route.ts` (POST) — validates
    environment ∈ {production, staging, development}, upserts
    `NenoIntegration`.
15. `src/app/api/integrations/neno/status/[projectId]/route.ts` (GET).
16. `src/app/api/integrations/neno/disconnect/route.ts` (POST).
17. `src/app/api/integrations/neno/sync/route.ts` (POST) — simulated sync
    with ~350ms delay, returns `{ synced, environment, syncedAt,
    recordsPushed }`.
18. `src/components/integrations/neno-connect-dialog.tsx` — Cloud icon
    header, API-key + environment (Select) fields. After connecting, the
    dialog transitions to a "Sync Project" view with a Re-sync button and
    a synced-records result card.

### Shared badges
19. `src/components/integrations/integration-badges.tsx` — `IntegrationBadges`
    (three pill row, emerald + check when connected, muted + hollow dot when
    not) + `IntegrationBadge` (single pill). Supports a `compact` mode
    (icon-only, for project cards).

## Implementation notes
- **Auth + ownership**: every route calls `requireProjectOwnership(projectId)`
  which checks `getServerSession(authOptions)`, then verifies the project
  exists and is owned by the user (admins bypass the ownership check).
  Returns 401 / 403 / 404 as appropriate.
- **Token safety**: `select` clauses on the status routes return only
  metadata — never `accessToken` / `apiKey`. Tokens are stored plaintext
  in the dev SQLite DB; the code comment in `integration-helpers.ts`
  flags that they should be encrypted in production.
- **Simulated operations**: `commit-push`, `deploy`, `sync` produce
  realistic-looking payloads (40-char SHAs, `dpl_xxx` deployment ids,
  slugified `.vercel.app` URLs, randomized record counts) so the UI flows
  feel real. To wire in real GitHub/Vercel/Neno API calls, swap the body
  of each simulated route for a fetch to the upstream API using the stored
  token — the request/response shape stays the same.
- **Project status updates**: `commit-push` → `github_synced`; `deploy` →
  `live` (+ `lastDeployUrl`, `lastBuildAt`). These match the existing
  `Project.status` enum in the Prisma schema so the workspace + project
  cards refresh automatically.
- **Framer-motion**: each dialog wraps its content (form + success/error
  state) in `motion.div` with `AnimatePresence mode="wait"` for a scale +
  fade transition. The Vercel deploy dialog also animates the live-URL
  card and the per-step "Live" badge in.
- **Styling**: branded header (icon in `bg-foreground` square, white text)
  with title + description; labeled inputs with leading icons (Key, User,
  GitBranch, Users, Globe, Settings2); security notes in muted text at
  the bottom of each connect dialog (`ShieldCheck` icon, emerald); emerald
  success checks. All dialogs are `max-w-md` and centered.

## API surface (for the workspace-page agent)
```
GET    /api/integrations/github/status/[projectId]   → { connected, username?, repoFullName?, defaultBranch?, connectedAt? }
POST   /api/integrations/github/connect               { projectId, accessToken, username, repoFullName, defaultBranch? }
POST   /api/integrations/github/disconnect             { projectId }
POST   /api/integrations/github/commit-push            { projectId, message?, files? }   → { ok, pushed, sha, branch, repoFullName, commitUrl, message, fileCount, pushedAt, author }

GET    /api/integrations/vercel/status/[projectId]    → { connected, vercelProjectName?, vercelProjectId?, teamId?, connectedAt? }
POST   /api/integrations/vercel/connect               { projectId, accessToken, teamId?, vercelProjectId?, vercelProjectName? }
POST   /api/integrations/vercel/disconnect             { projectId }
POST   /api/integrations/vercel/deploy                  { projectId }                       → { ok, deployed, deploymentId, url, status, projectName, teamId, deployedAt }

GET    /api/integrations/neno/status/[projectId]      → { connected, environment?, connectedAt? }
POST   /api/integrations/neno/connect                  { projectId, apiKey, environment? } → { connected, environment }
POST   /api/integrations/neno/disconnect              { projectId }
POST   /api/integrations/neno/sync                     { projectId }                       → { ok, synced, environment, syncedAt, recordsPushed }
```

## Component contracts (for the workspace-page agent)
```tsx
<GithubConnectDialog   projectId open onOpenChange onConnected? defaultRepo? defaultUsername? />
<GithubCommitDialog    projectId open onOpenChange changedFiles? defaultMessage? onPushed? />
<VercelConnectDialog   projectId open onOpenChange onConnected? defaultProjectName? />
<VercelDeployDialog    projectId open onOpenChange onDeployed? />
<NenoConnectDialog    projectId open onOpenChange onConnected? />
<IntegrationBadges     statuses={{ github, vercel, neno }} compact? />
<IntegrationBadge      kind={"github"|"vercel"|"neno"} connected label? />
```

All dialogs are uncontrolled: the parent owns the `open` state and just
needs to render the dialog once per project workspace. They reset their
internal form/state when `open` flips from `false` to `true` (via a
`useEffect([open])`).

## Verification
- `bun run lint` → clean (no errors in any of the 18 new files).
- `npx tsc --noEmit` → no errors in any new file (pre-existing errors in
  `examples/`, `skills/`, `src/app/api/stats/route.ts` remain untouched).
- End-to-end API verification via `curl` with a NextAuth session cookie
  (logged in as admin@codementor.ai):
  - GitHub: status→404/`{connected:false}`, connect→`{connected:true,...}`,
    status→`{connected:true,username,repoFullName,defaultBranch}`,
    commit-push→`{pushed:true,sha:40hex,commitUrl,branch,fileCount}`,
    disconnect→`{disconnected:true}`. ✅
  - Vercel: same lifecycle. Deploy →
    `{deployed:true,deploymentId:"dpl_xxx",url:"https://<slug>.vercel.app"}`. ✅
  - Neno: same lifecycle. Invalid `environment:"invalid_env"` falls back to
    `"production"` (validated against enum). Sync →
    `{synced:true,environment,syncedAt,recordsPushed:N}`. ✅
- Unauthenticated requests → 401 (`{error:"Unauthorized"}`). ✅
- dev.log: every route returned 200 (or 401 when expected). No compile
  errors after Turbopack compiled the new routes.

## Notes for other agents
- **The workspace page** (`/projects/[id]`, being built by another agent)
  needs to:
  1. Fetch all three statuses on mount (parallel `Promise.all` of the three
     `/api/integrations/{service}/status/[projectId]` endpoints).
  2. Render an `<IntegrationBadges>` row in the workspace header.
  3. Render the 5 dialogs (one per integration × {connect, action}) gated
     on the parent's `open` state, triggered by the "Connect …" buttons.
  4. Call `onConnected` / `onPushed` / `onDeployed` to refresh the
     statuses (re-fetch the status endpoints and update the badges).
- **Project cards** (if listing projects elsewhere) can include
  `<IntegrationBadges compact statuses={...} />` for at-a-glance status.
- **Token storage**: tokens are stored in plaintext in the dev DB. Before
  production: add a symmetric encryption helper (e.g. AES-GCM with a key
  from `process.env.INTEGRATION_ENCRYPTION_KEY`) and encrypt on write,
  decrypt only at the moment a route needs to call the upstream API.
- **OAuth upgrade path**: to swap PAT-based GitHub connect for real OAuth,
  add `src/app/api/integrations/github/oauth/start/route.ts` (redirects to
  `https://github.com/login/oauth/authorize?...`) +
  `src/app/api/integrations/github/oauth/callback/route.ts` (exchanges the
  code for an access token via the GitHub access-token endpoint, then upserts
  the `GitHubIntegration`). The existing `/connect` POST body shape
  (`accessToken, username, repoFullName, defaultBranch`) stays the same —
  just replace the source of `accessToken`.
