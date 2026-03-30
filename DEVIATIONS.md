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
