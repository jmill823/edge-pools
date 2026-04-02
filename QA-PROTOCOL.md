# QA-PROTOCOL.md — Edge Pools Quality Assurance
### Read this at the start of EVERY session alongside CC-LESSONS-LEARNED.md.

---

## Overview

This protocol replaces manual QA by Jeff. CC is responsible for functional verification. Jeff's phone test (Gate B) is for UX judgment only — "does this feel right?" — not for catching functional bugs. If Jeff finds a functional bug, the QA protocol failed.

---

## Pre-Build Checks

Before writing any code:

1. **Read CC-LESSONS-LEARNED.md.** Every lesson. Not optional.
2. **Read the session brief fully.** Understand acceptance criteria before building.
3. **Produce Gate A scope note.** List files to create, delete, modify, and NOT touch.
4. **Identify regression risks.** For every file you modify, list what existing functionality could break.

---

## Pre-Deploy Validation (before Gate B)

After building, before pushing to the preview branch, run this entire checklist. Every item must pass.

### Build Checks
- [ ] `npm run build` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npx prisma validate` — passes
- [ ] No hardcoded secrets (grep for API keys, passwords, connection strings)

### Fresh-State Functional Test

**This is the most important test.** Do not skip. Do not substitute with existing-state testing.

1. **Create a fresh pool:**
   - Use the create pool flow (not database seeding)
   - Select a template, edit at least one category, set deadline in the future, create
   - Verify: pool appears on dashboard with correct status badge

2. **Join as a fresh user:**
   - Open the invite link as if you are a new user (different auth context or test the join flow logic)
   - Verify: pool info displays, join creates PoolMember, redirect to picks

3. **Submit picks on fresh pool:**
   - Select one golfer per category
   - Verify: sticky headers, no-reuse greying, summary bar progress
   - Submit → confirmation modal → confirm → success screen
   - Verify: Entry + Pick records created in DB
   - Verify: success screen shows navigation buttons (no auto-redirect)

4. **Navigate the full loop:**
   - From success screen → View Leaderboard → leaderboard loads with correct status content
   - From leaderboard → PoolNav tabs all work
   - From dashboard → pool card shows correct links per status
   - Verify: no dead-end pages, no missing navigation links

5. **Edit picks (if applicable):**
   - Go to picks page on pool with existing entry
   - Verify: pre-fills existing selections
   - Change one pick, submit → verify update saved

6. **Status-specific behavior:**
   - For each pool status relevant to this session's changes, verify the page shows the correct content per STATE-MATRIX.md

### Regression Tests

For every previously built session, verify the core flow still works:

**Session 1 regression:**
- [ ] Landing page loads
- [ ] Dashboard shows pools with correct status badges
- [ ] Create pool flow completes (template → categories → create → invite)
- [ ] PoolNav tabs render on pool pages
- [ ] Invite page copy button works

**Session 2 regression:**
- [ ] Join via invite link works (test with existing pool)
- [ ] Picks page loads with categories and golfers
- [ ] Golfer selection works (tap to select, tap to deselect)
- [ ] Already-picked golfer greyed out in other categories
- [ ] Submit picks → confirmation → success
- [ ] Edit picks → pre-fills → saves

**Session 3 regression (once built):**
- [ ] Leaderboard loads with correct status content
- [ ] Mock scores populate and display
- [ ] Entry expansion works
- [ ] My Entry highlighted

**Session 4 regression (once built):**
- [ ] Multi-entry: submit Entry 1 → "Add Another Entry" button appears
- [ ] Multi-entry: Entry 2 starts with clean selections
- [ ] Single-entry pools: no multi-entry UI visible

**Session 5 regression (once built):**
- [ ] Manage page loads for organizer
- [ ] Status transitions work
- [ ] Admin pages hidden from non-organizers

### API Route Verification

For every API route touched in this session:
- [ ] Valid request → correct response (shape + status code)
- [ ] Invalid/missing data → proper error message (not 500)
- [ ] Without auth → 401 or 403
- [ ] Wrong role (player hitting organizer route) → 403

### Page Verification (375px viewport)

For every page touched in this session:
- [ ] Renders without console errors
- [ ] All primary tap targets ≥ 44px
- [ ] Loading state present (skeleton or spinner on initial load)
- [ ] Error state shows user-friendly message
- [ ] Empty state handled (not blank screen)

---

## Post-Deploy Verification (after Gate C merge)

After merging to main and Vercel deploys to production:

1. **Verify deploy completed:**
   - Check Vercel dashboard for successful production build
   - Note the deploy timestamp and commit SHA

2. **Production smoke test (3-5 key actions):**
   - Open edge-pools.com → landing page loads
   - Sign in → dashboard loads with pools
   - Navigate to a pool → PoolNav renders
   - Execute the primary flow built in this session → works
   - Execute one action from a previous session → still works

3. **Document:**
```
POST-DEPLOY VERIFICATION:
- Commit: [SHA]
- Deploy time: [timestamp]
- Smoke test: [actions tested] → ALL PASS / [action] FAILS
```

---

## Bug Capture

When a bug is found (by CC, Jeff, or QA process):

1. **Document immediately** in the current session output:
```
BUG FOUND:
- What: [description]
- Where: [page/route/component]
- Steps to reproduce: [exact steps]
- Expected: [what should happen]
- Actual: [what happens]
- Severity: P1 (blocks core flow) / P2 (works but wrong) / P3 (cosmetic)
- Root cause: [if known]
- Fix: [what was done]
```

2. **If the bug reveals a systemic mistake**, add a lesson to CC-LESSONS-LEARNED.md
3. **If the bug is deferred**, add it to the TODO with session number and priority

---

## Post-Build Updates

After every completed session, CC must:

1. **Update DEVIATIONS.md** with any spec divergences
2. **Add new lessons** to CC-LESSONS-LEARNED.md if any new mistake patterns were discovered
3. **Report the QA summary** in the build output:

```
QA SUMMARY:
- Build: PASS
- Lint: PASS
- Fresh-state test: PASS (pool created, picks submitted, leaderboard accessible)
- Regression (Session 1): PASS
- Regression (Session 2): PASS
- API routes tested: [list] → PASS
- Pages verified at 375px: [list] → PASS
- Bugs found during QA: [count] — [fixed/deferred]
- New lessons learned: [count] — [added to CC-LESSONS-LEARNED.md]
```

---

## What Jeff Tests (Gate B)

Jeff's phone test is for UX judgment only:

- **Does it feel fast?** Not "does it technically load" — does it feel responsive?
- **Is it intuitive?** Can I complete the flow without thinking about where to tap?
- **Does it look right?** Layout, spacing, readability on a real phone screen
- **Is anything confusing?** Unclear labels, unexpected behavior, missing context

Jeff should NOT be finding:
- Pages that don't load
- Buttons that don't work
- Missing navigation links
- Broken form submissions
- Server errors

If Jeff finds any of the above, the QA protocol failed. Add a lesson to CC-LESSONS-LEARNED.md.

---

*Edge Pools | QA-PROTOCOL.md | March 31, 2026*
*CC owns functional quality. Jeff owns UX judgment. Bugs that reach Jeff are process failures.*
