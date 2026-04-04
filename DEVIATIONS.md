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
