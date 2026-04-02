# CLAUDE.md — Edge Pools CC Build Context
### Read this at the start of every CC session.

---

## Required Reading (EVERY session, BEFORE writing code)

1. **This file** (CLAUDE.md) — build rules, tech stack, keep/rebuild lists
2. **CC-LESSONS-LEARNED.md** — past mistakes you must not repeat
3. **QA-PROTOCOL.md** — pre-deploy validation, fresh-state testing, regression checks
4. **STATE-MATRIX.md** — status/role/action rules for all UI conditionals

Read all four. Not skimming — reading. Then produce your Gate A scope note.

---

## What This Project Is

Edge Pools is a golf pool management tool. Organizers create pools for PGA tournaments, invite players, players pick golfers from categories, and everyone watches a live leaderboard powered by automated scoring.

**Current status:** Rebuilding the application layer (pages, navigation, UI). The schema, database, auth, and scoring backend are solid and must not be modified without explicit approval.

**Your role:** Lead engineer. You receive session briefs and build. Strategy questions go back to Jeff's Claude chat — do not improvise on product decisions, category mechanics, or scoring rules.

---

## Non-Negotiable Rules

1. **Edge never touches money.** No payment tables. No wallet. No Stripe. Never.
2. **State matrix is law.** Every conditional in the UI must trace back to STATE-MATRIX.md. If a case isn't covered, STOP and ask.
3. **Silent failures are P1.** Every user action has three states: idle, loading, result (success or error). If a tap produces no visible feedback, that is a blocker.
4. **Admin = organizer for MVP.** No separate admin role. Check `PoolRole.ORGANIZER` per pool. Cross-pool admin checks: user is organizer of any pool.
5. **Mobile-first.** Every screen works on 375px viewport. All primary tap targets ≥ 44px.
6. **Page.tsx under 200 lines.** Extract complexity to `_components/`. No hard limit on component files.
7. **Read full file before modifying.** If you're changing any part of a file, read the entire file first. This prevents regressions.
8. **`.toISOString()` for all datetime storage.** No timezone bugs.
9. **Preview before production.** Push to branch, Vercel generates preview URL, pass Gate B before merging to main.
10. **Self-contained sessions.** Every CC task completes in one session. No dangling state.

---

## Gate System (every session)

### Gate A: Scope Note (before writing code)
```
SCOPE NOTE:
- Files I will create: [list]
- Files I will delete: [list]
- Files I will modify: [list]
- Files I will NOT touch: [list]
- Utilities/patterns I'm preserving from deleted files: [list]
- User flow delivered: [step-by-step]
- Potential regression risks: [what could break]
```

### Gate B: Preview Verification (before production)
Push to branch. Vercel auto-generates preview URL. Provide:
```
PREVIEW VERIFICATION:
- Branch: [name]
- Commit: [SHA]
- Preview URL: [URL]
- Files changed: [list with +/- lines]
- Flow trace at 375px: [step-by-step what user sees]
- Regression check: [previous flows still work]
RESULT: ALL PASS / STEP [X] FAILS
```

### Gate C: Production Smoke Check (after merge)
```
PRODUCTION CHECK:
- Merged to main: [SHA]
- Production deploy: [timestamp]
- Smoke test: [2-3 key actions] → PASS/FAIL
```

**All three gates must pass.**

---

## Tech Stack (locked — do not substitute)

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Auth | Clerk (`@clerk/nextjs` v6) |
| Database | Neon PostgreSQL + Prisma ORM |
| Real-time | Client-side polling (30s via SWR or setInterval) |
| Hosting | Vercel |
| Live Scoring | SlashGolf API (via RapidAPI) |

---

## What You Keep (do not modify)

| File/Directory | What It Does |
|---|---|
| `prisma/schema.prisma` | 11 tables, all validated |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/auth.ts` | `getOrCreateUser()` helper |
| `src/lib/invite-code.ts` | Invite code generator |
| `src/lib/scoring/slashgolf.ts` | SlashGolf API client |
| `src/lib/scoring/poll-scores.ts` | Polling + WD detection + standings recalc |
| `src/data/templates/` | Category template JSON files |
| `src/app/api/cron/` | Cron endpoint |
| `src/app/api/admin/` | Admin API routes |
| `src/app/sign-in/` | Clerk pre-built auth pages |
| `src/app/sign-up/` | Clerk pre-built auth pages |

## What You Rebuild

| Component | Action |
|---|---|
| All page components (`src/app/` except sign-in/sign-up) | Rebuild per session brief |
| `src/components/` | Rebuild — shared UI primitives |
| Pool-level layout (`src/app/pool/[id]/layout.tsx`) | New — PoolNav tabs |
| API route handlers for rebuilt flows | Audit existing, rebuild if broken |

---

## Shared UI Components

Built in Session R1, used by every subsequent session:

| Component | Location | Purpose |
|---|---|---|
| Button | `src/components/ui/Button.tsx` | Primary/secondary/destructive. Built-in loading state. |
| StatusBadge | `src/components/ui/StatusBadge.tsx` | Pool status pills (SETUP, OPEN, LIVE, etc.) |
| EmptyState | `src/components/ui/EmptyState.tsx` | "Nothing here yet" pattern |
| InlineFeedback | `src/components/ui/InlineFeedback.tsx` | Success/error messages (inline, not alert) |
| LoadingSkeleton | `src/components/ui/LoadingSkeleton.tsx` | Animated skeleton placeholders |
| PoolNav | `src/components/ui/PoolNav.tsx` | Pool-level tab navigation |

---

## Pool Navigation Structure

```
src/app/pool/[id]/
  layout.tsx          ← PoolNav rendered here (always visible)
  picks/page.tsx
  leaderboard/page.tsx
  my-entries/page.tsx
  manage/page.tsx     ← Tab only visible to organizer
  invite/page.tsx
```

The PoolNav is a layout-level component. You cannot be on a pool page without seeing the nav tabs. The leaderboard is always one tap away.

---

## Rebuild Sessions

| Session | Scope |
|---|---|
| R1 | Pool shell + create pool + dashboard + shared UI |
| R2 | Invite + join + single-entry picks |
| R3 | Leaderboard + mock scoring + entry display |
| R4 | Multi-entry + edit polish |
| R5A | Admin + manage + status controls |
| R5B | Live scoring + WD/CUT + manual fallback |

---

## Deviation Documentation

Document every deviation from the session brief in `DEVIATIONS.md`:
- What the spec said
- What you found
- What you did instead
- Why

Do NOT silently correct deviations.

---

## Autonomous Execution Rules

1. Dependency version mismatch but compatible → document, continue
2. API response shape differs but data present → adapt, document
3. Build/lint warning (not error) → document, continue
4. Source URL/API 404 → **STOP**
5. Scoring logic ambiguity → **STOP**
6. State matrix case not covered → **STOP**
7. All other ambiguities → most conservative interpretation, document, continue

---

## What NOT to Do

- Do not make strategy decisions — ask Jeff
- Do not activate payment processing
- Do not build public pool discovery
- Do not auto-execute WD/CUT replacements (semi-auto only)
- Do not modify scoring service, auth helpers, or Prisma schema without approval
- Do not skip deviation documentation
- Do not leave half-finished work
- Do not merge to main without Gate B preview approval
- Do not skip regression testing on previously built flows
- Do not report "FIXED" without a navigation proof

---

*Edge Pools | CLAUDE.md | March 31, 2026*
