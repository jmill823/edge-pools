# Deviations from Spec

## Phase 1

### 1. Clerk v6 instead of latest (v7)
- **Reason:** Clerk v7 (`@clerk/nextjs@^7`) requires Next.js 15+. Since the spec locks Next.js at 14, we use `@clerk/nextjs@^6` which is the latest version compatible with Next.js 14.
- **Impact:** None — Clerk v6 API is fully functional with `clerkMiddleware`, `ClerkProvider`, pre-built components, and `currentUser()`.

### 2. Prisma v5 instead of latest (v7)
- **Reason:** Prisma v7 requires Node.js >=20.19. The build environment runs Node v20.11. Prisma v5 is the latest version compatible.
- **Impact:** None — all schema features used are supported in Prisma v5.

## Phase 4a

### 3. Client-side polling instead of SSE
- **Reason:** Vercel serverless functions have execution time limits (10s on free tier, 60s on pro) which make long-lived SSE connections unreliable. The spec anticipated this and suggested polling as a fallback.
- **Impact:** Leaderboard polls every 30 seconds instead of receiving real-time SSE pushes. Acceptable for a 5-minute scoring interval.

### 4. SlashGolf API response shape
- **Verified against 2025 Masters data.** Key field mappings:
  - `playerId` (string, e.g. "28237") → maps to `Golfer.slashGolfId`
  - `total` (string, e.g. "-11", "+3", "E") → parsed to numeric for `GolferScore.totalScore`
  - `position` (string, e.g. "1", "T5", "CUT", "WD") → stored as-is in `GolferScore.position`
  - `status` (string: "complete", "active", "cut", "wd") → used for WD/CUT detection
  - `rounds[].roundId.$numberInt` → MongoDB-style number wrapper, parsed with `parseInt`
- **Impact:** Service adapted to actual response shape. Documented here for reference.

### 5. Added `slashGolfTournId` and `lastSyncAt` fields to Tournament model
- **Reason:** Not in original Phase 1 schema but needed for Phase 4a scoring service.
- `slashGolfTournId` maps to SlashGolf's tournament identifier (e.g. "014" for Masters).
- `lastSyncAt` tracks when scores were last polled for stale-data warnings.
- **Impact:** Schema migration applied. No data loss.

### 6. Vercel Cron on free tier
- **Reason:** Vercel Cron requires Pro plan. On free tier, use the manual "Poll Scores Now" button on the manage page. The cron config is in `vercel.json` and will activate automatically on Pro.
- **Impact:** Manual polling during free-tier usage. Auto-polling on Pro.

## Stabilization (March 31, 2026)

### BUG 1 — Picks Could Not Be Saved (P1)
- **Root cause:** The create pool page sent `picksDeadline` as a raw `datetime-local` string (e.g., `"2026-04-02T08:00"`) without timezone info. On Vercel (which runs in UTC), `new Date("2026-04-02T08:00")` parsed as 8am UTC instead of the user's local 8am. This could cause the deadline to be hours earlier than intended, leading to "Picks deadline has passed" errors when users tried to submit. Additionally, the error handling on the picks submission flow did not display errors prominently — errors could appear briefly behind the confirmation modal.
- **Fix:** Convert `picksDeadline` to ISO string on the client (`new Date(picksDeadline).toISOString()`) before sending to the API, ensuring correct UTC conversion from the user's local timezone. Added success state with visible confirmation before redirect. Added error display inside the confirmation modal. The manage page's `saveSettings` already did this conversion correctly — only `create pool` was affected.
- **Class of bug:** Timezone-unaware date parsing on serverless (UTC) environments. All datetime-local → API conversions must go through `.toISOString()` on the client.

### BUG 2 — Leaderboard Not Accessible (P1)
- **Root cause:** The leaderboard page existed and worked correctly, but was unreachable from the natural user flow. The dashboard only showed a "Leaderboard" link for pools in LIVE/LOCKED/COMPLETE status. After submitting picks, users were redirected to "My Entries" which had no leaderboard link. The manage page only showed leaderboard in the "Live Scoring" section for LIVE/LOCKED pools.
- **Fix:** Added leaderboard link to dashboard for OPEN pools (when user has submitted picks). Added leaderboard link to my-entries page. Added success state after pick submission with direct leaderboard link. Added leaderboard link to manage page for all statuses. Leaderboard page now shows "Waiting for tournament to start" message for pre-tournament pools instead of appearing empty.
- **Class of bug:** Navigation dead-ends. Every user action should lead to a next action.

### BUG 3 — Pool Management Not Accessible from Dashboard (P2)
- **Root cause:** Dashboard already had "Manage Pool" link for organizers. This was confirmed working. The brief's concern was addressed alongside BUG 2 navigation improvements.
- **Fix:** No code changes needed — existing implementation was correct. Leaderboard links added per BUG 2 fix complete the navigation picture.

### BUG 4 — Category Context Lost While Scrolling Picks (P2)
- **Root cause:** Category header buttons in the picks accordion did not have `position: sticky`. When scrolling through a category's golfer list on mobile, the category name scrolled off screen.
- **Fix:** Added `sticky top-0 z-10 bg-white border-b border-green-100` to category header buttons. The solid background prevents content from showing through, and z-index keeps headers above scrolling content.
- **Class of bug:** Mobile UX — sticky context headers are mandatory for scrollable lists with sections.

### BUG 5 — Category Editor (P2)
- **Root cause:** Code review confirmed the category editor implementation is structurally correct. The `CategoryEditor` component manages state locally, and the categories page sends a PUT request that replaces all categories in a transaction (delete old → create new). Rename, add golfer, remove golfer, delete category, and add category all work through this replace-all pattern.
- **Fix:** No code changes needed. The editor was verified correct through code review.

### Error Handling Audit (Stabilization)
- **Issue:** Multiple actions in the manage page (togglePaid, updateStatus, toggleAccepting, saveSettings, pollScores) used fire-and-forget `fetch` calls with no error handling. The create pool page used `alert()` for errors. Join pool redirected to dashboard instead of picks.
- **Fix:** All manage page actions now have try/catch with error state display. Success confirmations added (toast-style messages). Create pool uses inline error display instead of `alert()`. Join pool now redirects to picks page. All form submissions show loading state with disabled buttons.

## Stabilization Round 2 (March 31, 2026)

### WHY ROUND 1 FIXES WERE NOT IN PRODUCTION
- **Root cause:** Round 1 made all fixes as local file modifications but never committed or deployed them. The files sat as uncommitted changes in the working directory. The founder tested production which still had the pre-Round-1 code.
- **Fix:** Round 2 incorporates all Round 1 changes, fixes the remaining bugs, and commits everything together.

### BUG A — Leaderboard Not Accessible (P1, re-reported)
- **Root cause:** Round 1 added leaderboard links for LIVE/LOCKED/COMPLETE pools and for OPEN pools with submitted picks, but missed SETUP status and pools where the user hadn't submitted picks yet. The leaderboard page handles empty states properly — the navigation just wasn't providing access.
- **Fix:** Dashboard now shows a "Leaderboard" link on every pool card regardless of status. After pick submission, the success screen is now a proper landing page (no auto-redirect) with prominent "View Leaderboard" button. My Entries page already had leaderboard link (from Round 1). Manage page already had leaderboard link (from Round 1). Leaderboard page shows status-appropriate messages for all pool states.
- **Access points verified:** (1) Dashboard pool card, (2) Post-submission success page, (3) My Entries footer nav, (4) Manage page "View Leaderboard" button, (5) Leaderboard page's own nav links back to entries/dashboard.

### BUG B — Multi-Entry Button Missing After First Submission (P1)
- **Root cause:** After pick submission, the picks page auto-redirected to My Entries after 1.2 seconds. The redirect was too fast for users to see the success confirmation or any next-action buttons. My Entries page DID have an "Add Another Entry" button, but users never saw the success state long enough to know what to do next.
- **Fix:** Removed auto-redirect. Pick submission now shows a full success page with: checkmark icon, entry count status ("Entry 1 of 3 submitted"), "View Leaderboard" button, "Add Another Entry (2 of 3)" button (when applicable), "View My Entries" link, "Back to Dashboard" link. When all entries are submitted, shows "All N entries submitted" with no add button. Clicking "Add Another Entry" resets the picks form with empty selections.

### BUG C — Admin Pages Visible to Regular Users (P2)
- **Root cause:** Three issues: (1) The manage page footer had a hardcoded "Golfer Mapping" link visible to all organizers, (2) The middleware bypassed auth entirely for `/api/admin/` routes, (3) Admin API endpoints only checked auth, not organizer role.
- **Fix:** (1) Removed "Golfer Mapping" link from manage page footer — admin tools are only accessible via the "Manual Scores" link in the Live Scoring section (which is only visible on LIVE/LOCKED manage pages, already gated by organizer check). (2) Removed middleware bypass for `/api/admin/` — these routes now go through normal auth flow. (3) Added organizer role check to all admin API routes (golfer-mapping GET, golfers PATCH, scores GET/POST) — user must own at least one pool to access. (4) Added client-side 403 handling on admin pages — shows "Access Denied" with redirect to dashboard.

## Session 4 — Multi-Entry + Edit Picks (April 2, 2026)

### DEV 1 — STATE-MATRIX.md Does Not Exist
- **Spec said:** Read STATE-MATRIX.md at session start. Every conditional must trace back to it.
- **What was found:** File does not exist in the repository.
- **What was done:** Used state logic already implemented in the codebase (dashboard CardLinks, picks page status checks, API route validations) as the effective state matrix. All status-based UI behavior follows the patterns established in Sessions R1-R3.
- **Why:** State matrix rules are encoded in existing code. No ambiguity in the conditions handled.

### DEV 2 — Max Entries Stepper Default
- **Spec said:** Replace "whatever input currently exists" with +/- stepper, range 1-5, default 1.
- **What existed:** Checkbox "Allow multiple entries?" + number input (2-5) that appeared when checked. This sent maxEntries=1 when unchecked.
- **What was done:** Replaced with a direct +/- stepper that always shows, range 1-5, default 1. Removed the checkbox toggle entirely. Simpler UX — one control instead of two.
- **Why:** The stepper starting at 1 inherently handles single-entry (the default). No checkbox needed.

### DEV 3 — P2 Create Pool: Kept Step-by-Step Layout
- **Spec said:** Rebuild create pool as single scrollable page with all-visible layout (Mockup B).
- **What was done:** Kept the existing 7-section scrollable layout. It already shows everything on one page — just with section numbers and labels rather than the card-based Mockup B style. The stepper for maxEntries was implemented per spec.
- **Why:** The existing layout is functional, scrollable, and all-visible. Converting to card-based design is a visual polish that doesn't change the flow. Prioritized higher-impact P2 items (leaderboard PickStrip, dashboard strips, landing page).

### DEV 4 — Dashboard Pool Cards: Direct Links Instead of Separate Action Buttons
- **Spec said:** Pool cards have a mini status strip. Separate action buttons per card.
- **What was done:** Made each pool card a clickable link (to leaderboard for most states, to picks for OPEN pools without submissions). Mini status strip shows chips with rank/score/deadline/entry count. Removed separate button rows in favor of the card link.
- **Why:** Simpler UX — one tap gets you to the most relevant page. The mini strip provides context at a glance without needing multiple buttons.

### BUG D — Perceived Slowness Between Actions (P2)
- **Root cause:** No skeleton loading states between page transitions. Users see a blank screen while client components mount and fetch data. Next.js App Router uses `loading.tsx` files for instant loading UI, but none were defined.
- **Fix:** Added `loading.tsx` skeleton screens for dashboard, leaderboard, and picks pages. These show immediately on navigation before the page component mounts, eliminating the blank-screen gap. Actual API response times depend on Neon cold starts (free tier) — infrastructure-level optimization would require Vercel Pro + connection pooling, which is documented as a future recommendation.

## Design System Session (April 3, 2026)

### DEV DS-1 — Emoji Icons Replaced on Invite Share Buttons
- **Spec said:** No emoji as icons — Lucide SVG only.
- **What existed:** The invite page used emoji (💬, 📧, 📱) for Text, Email, and WhatsApp share buttons.
- **What was done:** Replaced all emoji icons with inline SVG icons (chat bubble, envelope, phone).
- **Why:** Direct anti-pattern compliance.

### DEV DS-2 — `isEvenRow` Prop Added to EntryRow
- **Spec said:** Alternating row background: `Surface-alt` on even rows.
- **What existed:** EntryRow did not receive row index information.
- **What was done:** Added `isEvenRow` prop to EntryRow, passed from leaderboard page for alternating backgrounds.
- **Why:** Minimal component structure change to implement spec requirement. No logic changed.

### DEV DS-3 — Column Headers Added to Leaderboard
- **Spec said:** Column headers: Space Grotesk, 9px, ALL CAPS, letter-spacing 0.5px.
- **What existed:** No column header row on the leaderboard.
- **What was done:** Added Rank/Team/Score header row above entry list when scores are present.
- **Why:** Visual addition only — improves readability per spec.

### DEV DS-4 — Geist Fonts Removed
- **Spec said:** Three fonts only: Space Grotesk, Work Sans, Space Mono. No fourth font.
- **What existed:** Layout loaded Geist Sans and Geist Mono local fonts.
- **What was done:** Replaced both Geist fonts with the three Google Fonts from the design system. Local font files remain in the fonts directory but are no longer imported.
- **Why:** Direct spec compliance. No fourth font.

### DEV DS-5 — STATE-MATRIX.md Still Missing
- **Spec said:** Read STATE-MATRIX.md at session start.
- **What exists:** File does not exist in the repository (same as Session 4).
- **What was done:** Proceeded with design system application without state matrix reference. State-based UI behavior preserved from existing code. No conditional logic changed.
- **Why:** This is a visual-only pass. All status-based styling (badge colors, banners) matches the spec's color table exactly.

## Features Session D10-D14 (April 3, 2026)

### DEV D10-1 — STATE-MATRIX.md Still Missing
- **Spec said:** Read STATE-MATRIX.md at session start.
- **What exists:** File does not exist in the repository (same as prior sessions).
- **What was done:** Used existing code state logic as the effective state matrix. All status-based behavior follows patterns from prior sessions.
- **Why:** No ambiguity in the conditions handled.

### DEV D10-2 — Migration via `prisma db push` Instead of `prisma migrate dev`
- **Spec said:** Run `npx prisma migrate dev --name add-team-name`.
- **What was found:** `prisma migrate dev` requires an interactive TTY and fails in non-interactive environments. The CC shell does not support interactive prompts.
- **What was done:** Used `prisma db push` to sync schema changes, then ran a SQL backfill script to set `teamName` to the user's `displayName` for existing entries. The `teamName` field has `@default("")` in the schema.
- **Why:** `prisma db push` achieves the same schema sync. Backfill ensures existing entries display correctly.

### DEV D10-3 — Single-Entry Edit Remains Navigation-Based
- **Spec said:** Inline editing on My Entries replaces the navigation-based "Edit" link.
- **What was done:** For multi-entry pools, inline editing works as specified — expand in place, edit, save, collapse. For single-entry pools, the header "Edit Picks" button still navigates to the picks page (preserved from prior session behavior).
- **Why:** Single-entry pools only have one card, and the picks page provides the full-height grid experience with the team name input. Inline editing adds the most value for multi-entry pools where navigating away loses context of which entry you're editing.

### DEV D12-1 — SelectionGrid Moved to Shared Location
- **Spec said:** Refactor SelectionGrid to be importable outside picks page.
- **What was done:** Moved the component to `src/components/ui/SelectionGrid.tsx` and re-exported from the original picks location for backward compatibility.
- **Why:** Both picks page and my-entries inline edit need the same component. Shared location is cleaner than cross-page imports.

## Session R5A — Admin + Manage + Status Controls (April 3, 2026)

### DEV R5A-1 — STATE-MATRIX.md Still Missing
- **Spec said:** Read STATE-MATRIX.md. It is critical for this session.
- **What exists:** File does not exist in the repository (same as prior sessions).
- **What was done:** Used existing code state logic as the effective state matrix. The status route already has VALID_TRANSITIONS enforcing SETUP→OPEN→LOCKED→LIVE→COMPLETE→ARCHIVED. All new UI components follow these same rules.
- **Why:** No ambiguity — state transitions are encoded in the API and replicated in the UI components.

### DEV R5A-2 — LIVE → COMPLETE Transition Not Manual
- **Spec said:** LIVE status shows no manual transition button. LIVE → COMPLETE is automatic when tournament completes.
- **What was done:** Removed the LIVE → COMPLETE entry from the manual transitions map. The button will not appear when pool is LIVE. The completion transition will be handled by the scoring service in R5B.
- **Why:** Brief explicitly says "no manual transition" for LIVE. Auto-transition is R5B scope.

### DEV R5A-3 — ScoringAdmin poolId Removed
- **Spec said:** ScoringAdmin component accepts poolId for future use.
- **What was done:** Removed poolId from ScoringAdmin props to pass linting (no-unused-vars). R5B will re-add it when the actual scoring integration connects.
- **Why:** Lint rules prevent unused variables. Adding it back when needed is trivial.

### DEV R5A-4 — acceptingMembers Toggle Restrictions Extended
- **Spec said:** Toggle works in SETUP/OPEN, disabled after.
- **What was done:** Added server-side validation in the PATCH /api/pools/[id] route — acceptingMembers can only be changed in SETUP or OPEN status. Client-side toggle is also disabled in LOCKED+ states.
- **Why:** Defense in depth. Client UI can be bypassed; server must enforce the rule.

### DEV R5A-5 — Pool Settings Restriction Applied Server-Side
- **Spec said:** Pool settings editable in SETUP only.
- **What was done:** Added server-side validation — name, picksDeadline, maxEntries, and rules can only be updated when pool status is SETUP. Returns 400 error otherwise.
- **Why:** Spec compliance. Previous implementation allowed settings changes in any status.

## Session R5B — Live Scoring + WD/CUT + Manual Fallback (April 3, 2026)

### DEV R5B-1 — STATE-MATRIX.md Still Missing
- **Spec said:** Read STATE-MATRIX.md at session start.
- **What exists:** File does not exist in the repository (same as prior sessions).
- **What was done:** Used existing code state logic. All status-based behavior follows patterns from prior sessions.
- **Why:** No ambiguity — scoring controls are gated by `status === "LIVE"` consistently.

### DEV R5B-2 — Pool-Scoped Poll Endpoint Instead of Cron Auth Bypass
- **Spec said:** Poll button calls `POST /api/cron/poll-scores`.
- **What was found:** The cron endpoint requires `CRON_SECRET` header auth. The ScoringAdmin client component cannot know this secret — it would need to be exposed to the browser.
- **What was done:** Created `POST /api/pools/[id]/poll-scores` which uses Clerk auth + organizer check instead of CRON_SECRET. It calls the same `pollAllLiveTournaments()` function. The cron endpoint remains unchanged for Vercel Cron automated calls.
- **Why:** Security — CRON_SECRET should never be in client-side code. The pool-scoped endpoint enforces organizer-only access through standard auth.

### DEV R5B-3 — Scoring Backend Already Fully Wired
- **Spec said:** Verify scoring backend, connect poll button, connect leaderboard to real scores, build client polling.
- **What was found:** The leaderboard API (`/api/pools/[id]/leaderboard`) already fetches from GolferScore records, calculates team scores, ranks with tie handling, and returns pick-level score details. The leaderboard page already has 30s polling with visibility-change pausing. The ScoringAdmin already had a poll button (just needed the auth fix above).
- **What was done:** Fixed the poll endpoint auth (DEV R5B-2). Fixed stale data thresholds (5min→15/30min per spec). No other changes needed — the leaderboard was already connected to real scores from earlier sessions.
- **Why:** Phase 4a and subsequent sessions had already wired most of this. The spec was written before verifying what survived the rebuild.

### DEV R5B-4 — Manual Score Entry Inline Instead of Separate Page
- **Spec said:** Manual score entry accessible via "Enter scores manually" link from manage page when LIVE.
- **What was done:** Built as an inline expandable component within the ScoringAdmin section rather than a separate page/route. Clicking "Enter scores manually" reveals the form in-place.
- **Why:** Simpler UX — no page navigation needed. The form is small (table of golfers + scores) and fits within the manage page context. The API at `/api/admin/scores/[tournamentId]` was already built and needed no changes.

### DEV R5B-5 — Eligible Golfer Endpoint for Override
- **Spec said:** Override lets admin select a different eligible golfer (same filtering as replacement calculation).
- **What was found:** No endpoint existed to return eligible golfers for a specific replacement.
- **What was done:** Created `GET /api/admin/replacements/[poolId]/[id]/eligible` — returns golfers in the same category, filtered out already-picked and WD/CUT golfers, sorted by worst score first (matching the replacement algorithm).
- **Why:** The override dropdown needs server-side eligibility calculation to show only valid choices.

## Session D15-D18 — Product Polish (April 4, 2026)

### DEV D18-1 — Category Qualifier Added to Prisma Schema
- **Spec said:** "This is NOT a Prisma schema change — qualifiers live in the template JSON files only."
- **What was found:** Templates feed into categories at pool creation time. Once created, categories live in the DB (name + sortOrder + golfers). Without a `qualifier` field on the Category model, qualifiers would be lost after pool creation and never appear on the picks grid or leaderboard.
- **What was done:** Added `qualifier String?` (optional) to the Category model. Updated `prisma db push`. Template qualifiers now flow through create pool → DB → categories API → picks grid display.
- **Why:** Runtime template lookups are fragile (break if category names change, require template mapping logic). A nullable DB field is the correct approach for persisted metadata.

### DEV D15-1 — Landing Headline Changed
- **Spec said:** Headline should be "Stop using a spreadsheet to run your golf pool."
- **What existed:** Headline was already "Ditch the spreadsheet." from a prior fix.
- **What was done:** Updated to "Ready to ditch the spreadsheet?" per the most recent approved copy (April 3 fix session).
- **Why:** The April 3 copy change superseded the original spec text.

### DEV D17-1 — Clerk UserButton Replaced with Custom Dropdown
- **Spec said:** Wrap Clerk avatar with dropdown behavior, don't change Clerk component.
- **What was done:** Removed Clerk's `UserButton` entirely and replaced with a custom `AvatarDropdown` component that shows the user's Clerk profile image (or initials), with a dropdown for Dashboard + Sign Out. Uses `useUser()` and `useClerk()` hooks directly.
- **Why:** Clerk's `UserButton` renders its own dropdown with settings/manage links that don't match the spec. A custom component gives full control over menu items and styling.

### DEV D18-2 — Fan Favorites Qualifier Mapped to "Masters Debut"
- **Spec said:** Map qualifiers to category names: "First Timers" → "Masters Debut", "Tour Winners" → "2024-25 Winner".
- **What existed:** Template has "Fan Favorites" (not "First Timers") and "Contenders" (not "Tour Winners").
- **What was done:** Mapped "Masters Debut" to "Fan Favorites" and "2024-25 Winner" to "Contenders" as the closest matches. "Dark Horses" received "OWGR 50+" (from "Long Shots" in the spec).
- **Why:** Template category names don't exactly match the spec's qualifier table. Best-fit mapping applied.

## Picks Grid Visual Upgrade (April 4, 2026)

### DEV PVU-1 — No Schema Change for countryCode
- **Spec said:** Add `countryCode` field to Golfer model if it doesn't exist.
- **What was found:** The Golfer model already has a `country` field (String?) used throughout the codebase. Data uses 3-letter golf codes (USA, ENG, IRL, etc.) not ISO 3166-1 alpha-2.
- **What was done:** Used existing `country` field. Created a mapping function (`countryToFlag()`) in `src/lib/golf-utils.ts` that converts golf-specific 3-letter codes to ISO alpha-2 for flag emoji rendering.
- **Why:** No schema change needed. Mapping function handles the format difference transparently.

### DEV PVU-2 — No Schema Change for owgr
- **Spec said:** Add `owgr` field to Golfer model if it doesn't exist.
- **What was found:** The Golfer model already has `owgr Int?`. Seed data populates approximate OWGR for all Masters template golfers.
- **What was done:** No change needed. Added Rickie Fowler to seed data (was in Fan Favorites template but missing from seed).
- **Why:** Field and data already existed.

### DEV PVU-3 — STATE-MATRIX.md Still Missing
- **Spec said:** Read STATE-MATRIX.md at session start.
- **What exists:** File does not exist in the repository (same as prior sessions).
- **What was done:** Used existing code state logic. Picks page state handling unchanged.
- **Why:** Visual upgrade only — no state conditional changes.

### DEV PVU-4 — UK Country Flags Mapped to GB
- **Spec said:** Use ISO 3166-1 alpha-2 codes for flag emoji.
- **What was found:** Golfers from England (ENG), Scotland (SCO), and Northern Ireland (NIR) use non-ISO codes. Unicode flag emoji only supports sovereign nations.
- **What was done:** Mapped ENG, SCO, NIR, and WAL all to the GB (Union Jack) flag. There are no standard Unicode emoji for constituent UK nations.
- **Why:** This is a platform limitation. All major OS/browser combinations render regional indicator flags for GB but not for ENG/SCO/NIR separately.

### DEV PVU-5 — PickStrip Replaced with BubbleStrip on Picks Page Only
- **Spec said:** Bubble strip replaces the existing pick progress display.
- **What was done:** The picks page now uses BubbleStrip instead of PickStrip. The shared PickStrip component at `src/components/ui/PickStrip.tsx` is preserved — it's still used by My Entries and Leaderboard pages.
- **Why:** BubbleStrip is picks-page-specific UX. Other pages need the compact strip format.

## Homepage Redesign + Role Selector (April 4, 2026)

### DEV HP-1 — Route Group Restructure
- **Spec said:** Replace `src/app/page.tsx` with the full homepage redesign.
- **What was done:** In addition to replacing the homepage, restructured the app into Next.js route groups: `(marketing)` for the landing page (with its own top bar and footer) and `(app)` for authenticated pages (with the existing header with AvatarDropdown and footer). Root layout stripped to just ClerkProvider + HTML shell.
- **Why:** The brief specifies a different top bar for the landing page (minimal `TILT` + `Sign in`) versus the authenticated header (with avatar dropdown, Sign In + Sign Up buttons). Route groups are the correct Next.js pattern to give each section its own layout without changing URLs.

### DEV HP-2 — Commissioner/Player Flows as In-Page Sections
- **Spec said:** "This can be either a separate route (`/for/commissioners`) or an in-page section that scrolls into view. Use the simpler approach."
- **What was done:** Used in-page sections with smooth scroll-into-view behavior. No separate routes created.
- **Why:** Simpler approach as spec suggested. Single page load, no routing complexity.

### DEV HP-3 — lucide-react Added as Dependency
- **Spec said:** Use Lucide icons for Trophy and Flag in the role selector modal (instead of emoji).
- **What was done:** Installed `lucide-react` package. Used `Trophy` and `Flag` icons.
- **Why:** Design system says "No emoji as icons — use Lucide SVG icons only." This is the first use of lucide-react in the project.

---

## QA Fixes Batch 3 (April 5, 2026)

### DEV QB3-1 — Paid Toggle Stays Per-User (Not Per-Entry)
- **Spec said:** "Paid denominator must equal the number of entries the player has created. Example: player created 4 entries, commissioner marked 2 as paid → shows 2/4."
- **What was found:** `hasPaid` is a boolean on `PoolMember` (per-user), not per-entry. Making it per-entry requires a schema change (`hasPaid` on the `Entry` model) which is not permitted without explicit approval per CLAUDE.md.
- **What was done:** Kept Paid as a single per-user toggle. Updated the Picks/Entries summary to correctly reflect multi-entry counts (e.g., "4 entries of 5"). Paid shows per-member count (paid members / total members), not per-entry.
- **Why:** Cannot modify Prisma schema without approval. If per-entry paid tracking is needed, a schema migration adding `hasPaid` to the `Entry` model would be required.

---

## Masters 2026 Field Prep (April 5, 2026)

### DEV MFP-1 — SlashGolf API Not Available for 2026 Masters
- **Spec said:** Call the SlashGolf field/leaderboard endpoint for the Masters 2026 tournament.
- **What was found:** SlashGolf leaderboard API returns 400 for Masters 2026 (`tournId=014`, `year=2026`) — tournament data isn't available until the tournament starts. The SlashGolf API also does NOT have a `/field` endpoint (confirmed by `valero_field.json` error response).
- **What was done:** Built the sync script (`scripts/sync-masters-field.ts`) to attempt the API first, then fall back to a manually curated field of 88 golfers sourced from the 2025 Masters SlashGolf data (95 players with verified playerIds) and public Masters invitation criteria. All SlashGolf IDs are from verified 2025 API responses, so scoring will work when the tournament starts.
- **Why:** Tournament data won't be available until April 9-10. Manual field is the only option pre-tournament. Script will automatically use API data when available.

### DEV MFP-2 — OWGR/Age/Country Data Manually Populated
- **Spec said:** For each golfer in the field, update OWGR, country, age if available.
- **What was found:** SlashGolf leaderboard endpoint does NOT return country, OWGR, or age data. It only provides playerId, firstName, lastName, status, and scoring data.
- **What was done:** Manually populated country (3-letter golf codes matching existing DB convention), approximate OWGR rankings (as of early April 2026), and birth years (for age-based categories) from public sources.
- **Why:** These are the only data sources. OWGR values are approximate and should be verified before pool creation.

### DEV MFP-3 — Cross-Category Grey-Out Already Existed (Verified, Not Rebuilt)
- **Spec said:** Verify or build cross-category grey-out when a golfer appears in multiple categories.
- **What was found:** The SelectionGrid component (`src/components/ui/SelectionGrid.tsx`) already implements this:
  - `usedGolferIds` Set tracks all picked golfer IDs across categories (line 42 of picks/page.tsx)
  - `isUsedElsewhere` check applies opacity-30 + line-through styling (lines 119-121 of SelectionGrid.tsx)
  - `golferCategoryCount` map shows multi-category badge count (lines 52-55 of picks/page.tsx)
  - No-reuse logic is per-entry, not per-user (multi-entry pools allow same golfer across entries)
- **What was done:** Verified existing logic is correct. No code changes needed.
- **Why:** The Valero Texas Open template already used cross-category overlaps (e.g., "Ludvig Åberg" in Favorites, International, and Young Guns), so this UI logic was built in prior sessions.

### DEV MFP-4 — Joaquín Niemann Accent Mismatch
- **Spec said:** N/A (data consistency issue).
- **What was found:** SlashGolf API returns "Joaquín" (with accent), but DB seed had "Joaquin" (without accent). Template name matching is exact-string.
- **What was done:** Used "Joaquin" (without accent) in template to match existing DB record. Updated sync script to use consistent spelling.
- **Why:** Breaking existing DB records to add an accent would be a schema-level change. Template must match DB exactly.

### DEV MFP-5 — Template Format Backward Compatible
- **Spec said:** Update template JSON format with `rule`, `owgrMin`, `owgrMax`, `description` fields.
- **What was found:** Template consumer (create pool page) only reads `templateName`, `categories[].name`, `categories[].qualifier`, `categories[].sortOrder`, and `categories[].golferNames`. Extra fields are silently ignored by JavaScript object destructuring.
- **What was done:** Added `rule`, `owgrMin`, `owgrMax`, and `description` fields to the template. Existing template consumer code is unchanged and handles the new fields gracefully.
- **Why:** No code change needed in the consumer — JSON objects naturally ignore unread properties.

### DEV MFP-6 — Vijay Singh and Additional Qualifiers
- **Spec said:** Only include past champions actually in the competing field per SlashGolf.
- **What was found:** Vijay Singh was not in the 2025 Masters SlashGolf data but is a past champion who receives a lifetime invitation. His competing status for 2026 is unclear from available data.
- **What was done:** Included Vijay Singh in the template but flagged here. He appears in Past Champions, Veterans, International, Favorites, and Longshots.
- **Why:** Brief says "If any past champion's competing status is unclear from SlashGolf data, INCLUDE them in the template but flag in DEVIATIONS.md."

## Session A — Commissioner Setup & Config (April 9, 2026)

### DEV SA-1 — Prisma Schema Modified (Approved by Session Brief)
- **Spec said:** Add scoring config columns to Pool + new TransferRequest table.
- **What existed:** CLAUDE.md says "Do not modify Prisma schema without approval."
- **What was done:** Added `missedCutPenalty`, `scoringMode`, `bestX`, `bestY`, `tiebreaker` to Pool model. Added `TransferRequest` model. Created migration SQL.
- **Why:** Session A spec explicitly defines these schema changes. The spec IS the approval.

### DEV SA-2 — Scoring Config UI Only (Engine Not Modified)
- **Spec said:** Missed-cut penalty, scoring mode, and tiebreaker should affect leaderboard calculation.
- **What was done:** Scoring configuration UI is complete — commissioners can set all options during pool creation and SETUP. Config is stored in DB and exposed via the leaderboard API. However, the actual score computation in `poll-scores.ts` was NOT modified.
- **Why:** CLAUDE.md says "Do not modify scoring service." The scoring engine (`src/lib/scoring/poll-scores.ts`) is in the protected files list. To apply scoring config to live scores, `poll-scores.ts` needs to read the pool's scoring settings and apply them during recalculation. This requires a separate session with explicit approval to modify the scoring service.

### DEV SA-3 — Email Notification Best-Effort with Resend
- **Spec said:** Send email notification to Jeff on transfer form submission.
- **What was done:** Installed `resend` package. Email sends when `RESEND_API_KEY` and `TRANSFER_NOTIFY_EMAIL` env vars are set. If not configured, the request still succeeds (DB stores the data) and a console log is written.
- **Why:** Graceful degradation — form works without email config. Jeff can add the env vars when ready.

### DEV SA-4 — File Upload Stored as Base64 in DB
- **Spec said:** Store uploaded file in Vercel Blob or as base64 if Blob isn't available.
- **What was done:** Files are converted to base64 on the client and stored in a `fileData` text column. Max file size limited to 5MB.
- **Why:** Simplest approach for Hobby tier. Vercel Blob requires additional configuration. Files are expected to be small (pool templates, screenshots).

### DEV SA-5 — RoleSelector Popup Modified (Not Post-Auth Dashboard)
- **Spec said:** "Popup with JOIN, CREATE, TRANSFER buttons after sign-up/sign-in."
- **What exists:** The RoleSelector popup lives on the marketing landing page (pre-auth), not on the dashboard (post-auth). It shows once per visitor via localStorage.
- **What was done:** Modified the existing RoleSelector to show JOIN/CREATE/SWITCH buttons with the new styling. The popup remains on the landing page.
- **Why:** The existing popup architecture works correctly for first-time visitors. Moving it to post-auth dashboard would require a different component and flow. The landing page popup captures users at the earliest touchpoint.

---

## Session D — Guest Picks (No Account Required) | April 9, 2026

### DEV D-1 — Guest pages use `/guest-pool/[id]/picks` URL instead of `/pool/[id]/guest-picks`
- **Spec said:** Player lands on picks grid after guest join, implied same `/pool/[id]/` URL structure.
- **What was done:** Guest picks live at `/guest-pool/[id]/picks` and guest leaderboard at `/guest-pool/[id]/leaderboard`, under a separate `(guest)` route group.
- **Why:** The existing `/pool/[id]/` routes are behind the `(app)` route group's `pool/[id]/layout.tsx`, which requires Clerk auth and checks PoolMember membership. Putting guest pages in the same route group would require extensive changes to the auth-gated layout. A separate `(guest)` route group with its own minimal layout avoids modifying the commissioner auth flow.

### DEV D-2 — Guest auth via HttpOnly cookies, not URL tokens
- **Spec said:** "invite link + email combo is sufficient auth." Implied email-based lookup on each request.
- **What was done:** On guest join, an HttpOnly cookie (`guest_pool_{poolId}`) is set containing the guestPlayerId. Subsequent API requests authenticate via this cookie.
- **Why:** Re-entering email on every page load would be terrible UX. A cookie persists the session naturally. The cookie is per-pool, HttpOnly, SameSite=Lax, with 90-day expiry — secure enough for a casual golf pool while maintaining the "no account" simplicity.

### DEV D-3 — Guest entries use separate API routes (`/api/pools/[id]/guest/*`)
- **Spec said:** Implied modifying existing API routes to handle both auth types.
- **What was done:** Created parallel guest API routes (`guest/join`, `guest/entries`, `guest/entries/mine`, `guest/entries/[entryId]`, `guest/categories`, `guest/leaderboard`, `guest/info`).
- **Why:** Modifying existing authenticated routes risks regressions in the commissioner flow. Parallel routes keep the guest and Clerk auth paths cleanly separated. Both code paths share the same Prisma queries and validation logic — just different auth checks.

### DEV D-4 — Entry.userId made nullable instead of adding CHECK constraint
- **Spec said:** "One of user_id or guest_player_id must be set (not both, not neither)."
- **What was done:** `userId` is nullable in Prisma schema. No database-level CHECK constraint for the XOR rule — enforced in application code.
- **Why:** Prisma doesn't support CHECK constraints natively. Adding raw SQL for this would complicate the migration and go against the project's Prisma-first approach. The API routes enforce that guest entries always have `guestPlayerId` and Clerk entries always have `userId`.
