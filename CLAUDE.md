# Edge Pools — Build Context

## What This Is
Edge Pools is a golf pool management web app. Organizers create pools tied to PGA tournaments, invite friends, and everyone picks golfers across categories. Live scoring pulls from SlashGolf API. Built with Next.js 14 (App Router), Clerk auth, Prisma + PostgreSQL, Tailwind CSS. Deployed on Vercel.

## Tech Stack
- **Framework:** Next.js 14.2 (App Router)
- **Auth:** Clerk v6 (`@clerk/nextjs@^6`)
- **DB:** Prisma v5 + PostgreSQL (Neon)
- **Styling:** Tailwind CSS v3
- **Deployment:** Vercel

## Project Structure
- `src/app/` — Pages and API routes (Next.js App Router)
- `src/components/` — Shared React components
- `src/lib/` — Utilities (auth, db, invite-codes, scoring)
- `src/data/` — Tournament category templates
- `prisma/` — Schema and migrations

## Key Flows
1. **Create Pool:** Organizer picks tournament + template → categories populated → pool in SETUP
2. **Join Pool:** Player uses invite code → PoolMember created → redirect to picks
3. **Make Picks:** Player selects one golfer per category → entry created
4. **Leaderboard:** Scores polled from SlashGolf → teamScore/rank calculated → live display
5. **Replacements:** WD/CUT detected → PendingReplacement created → admin confirms

## Non-Negotiable Rules

1. **Mobile-first.** Every page must work at 375px width. Tap targets ≥ 44px.
2. **No blank screens.** Loading, empty, and error states are mandatory.
3. **Auth on every API route.** Use `getOrCreateUser()` — never trust client-side auth alone.
4. **Prisma transactions** for multi-record writes (entries + picks, categories + golfers).
5. **No hardcoded secrets.** Use environment variables.
6. **Deadline enforcement** on both client AND server. Never trust client-only checks.
7. **Pool status gates.** Check pool status before allowing actions (picks only in OPEN/SETUP, categories only in SETUP, etc.).
8. **Organizer-only actions** verified server-side: `pool.organizerId === user.id`.
9. **No feature creep.** Build what the brief says. Document deviations in DEVIATIONS.md.
10. **No push without QA-CHECKLIST.md completed.** Run the full checklist at `QA-CHECKLIST.md` in the project root. Mark every item. If any P1 item fails, fix it before pushing. Paste the completed checklist in the build summary.
11. **Test on 375px viewport.** Every page you touch — resize browser to 375px width and verify layout, tap targets, and readability. Screenshots are encouraged.
12. **Silent failures are P1.** If a user action (tap, submit, navigate) produces no visible result — no error message, no redirect, no confirmation — that is a P1 blocker. Users must always know what happened.
