# Task 6+8 — Site Structure (Navbar / Footer / AppLayout / Landing / Dashboard / Settings / Admin)

Agent: site-structure (parallel build)
Date: 2026-08-28

## Scope
Built the main website structure for "CodeMentor AI" — the marketing landing page, an authenticated dashboard, a settings page, an admin page, plus the shared Navbar / SiteFooter / AppLayout components.

## Files created
1. `src/components/layout/navbar.tsx` — responsive sticky navbar (logo, desktop nav with active highlighting, theme toggle, user dropdown with role badge, mobile Sheet menu)
2. `src/components/layout/site-footer.tsx` — 3-column footer with `mt-auto` sticky-bottom behavior
3. `src/components/layout/app-layout.tsx` — `AppLayout` wrapper (`min-h-screen flex flex-col` + Navbar + main(flex-1) + Footer)
4. `src/app/page.tsx` — landing page (OVERWRITES the previous AI assistant; another agent moved the assistant to `/assistant`). Auth-aware: redirects logged-in users to `/dashboard`, otherwise shows hero + features + how-it-works + CTA.
5. `src/app/dashboard/page.tsx` — protected dashboard with stat cards + recent conversations list
6. `src/app/settings/page.tsx` — profile / security / appearance settings (forms show "coming soon" toasts)
7. `src/app/admin/page.tsx` — admin-only page (ADMIN/SUPER_ADMIN) with platform stats + placeholder user table + all-conversations table

## Key implementation details
- **Auth**: client-side `useSession()` from `next-auth/react`; `signOut({ callbackUrl: "/" })` for logout. Server-side auth is enforced by `src/middleware.ts` (already existed).
- **RBAC**: `roleBadgeClass`/`roleLabel` helpers exported from navbar.tsx and reused by admin page. SUPER_ADMIN=emerald, ADMIN=violet, USER=muted.
- **Hydration safety**: theme toggle and theme selector buttons use a `mounted` state guard so SSR matches first client render. Auth-dependent UI shows a pulsing skeleton during `status === "loading"`.
- **Admin access control**: client-side redirect to `/dashboard` if non-admin (in addition to server-side middleware). Shows `AccessDenied` screen with "Back to dashboard" button during the brief redirect window. LoadingScreen during `status === "loading"` to avoid flash of admin UI.
- **Responsive**: mobile-first. Navbar collapses to hamburger → right-side Sheet. Grids use `sm:grid-cols-2 lg:grid-cols-4`. Tables wrapped in shadcn `Table` (auto `overflow-x-auto`).
- **Dark mode**: all components use shadcn semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `bg-accent`) so dark mode works automatically. Theme toggle uses `next-themes` `setTheme`.
- **Landing redirect**: `useEffect` + `router.replace("/dashboard")` when authenticated. The landing is rendered during loading so unauthenticated users see it immediately; authenticated users get redirected.

## Verification
- `bun run lint` — clean (no errors in new files)
- `npx tsc --noEmit` — no errors in new files (only pre-existing errors in `examples/` and `skills/`)
- `curl http://localhost:3000/` — returns landing HTML ("Your AI Code", "Get Started Free", "How it works")
- `curl /dashboard`, `/settings`, `/admin` (unauth) → 307 redirect to `/login?callbackUrl=...`
- Logged in as `admin@codementor.ai` / `admin123` (SUPER_ADMIN):
  - `GET /dashboard` → 200, content includes "Welcome back", "Conversations", "Messages", "Snippets", "Satisfaction", "Recent conversations"
  - `GET /settings` → 200, content includes "Settings", "Profile", "Security", "Appearance", "Display name", "Member since", "Update password", "Sign out of all devices"
  - `GET /admin` → 200, SSR shows "Loading…" then hydrates to admin UI (client-only render due to role gate)
- dev.log shows no compile errors after file changes

## Notes for other agents
- **Assistant route**: the previous assistant at `/` has been overwritten. The assistant is now expected at `/assistant` (another agent's responsibility). Dashboard and admin pages link to `/assistant?c={id}` to open a specific conversation — the assistant should read the `c` query param to auto-load that conversation.
- **Snippets / Presets routes**: navbar links to `/snippets` and `/presets`. These routes are not built yet — another agent may build them as standalone pages, or they could be the existing assistant dialogs surfaced as routes. Either way, the links are correct.
- **`/api/admin/users`**: the admin page shows a placeholder user table with a single mock row (the current admin). When the `/api/admin/users` endpoint is built, the table can be populated with real data.
- **`/api/auth/profile`**: the settings page has a profile-edit form that currently shows a "coming soon" toast. When the profile-update API is built, wire the form's `onSubmit` to `POST /api/auth/profile` and refresh the session.
- **`Member since`**: the settings page shows "—" because the session doesn't include `createdAt`. When `/api/auth/me` is extended to return `createdAt`, populate that field.
- **Role badge helper**: `roleBadgeClass(role)` and `roleLabel(role)` are exported from `src/components/layout/navbar.tsx` — reuse them elsewhere rather than duplicating.
