# Edge Pools — Pre-Push QA Checklist
### Run this ENTIRE checklist before pushing to main. No exceptions.

## Date: ___________
## Build/Feature: ___________

---

## Backend

- [ ] `npm run build` — zero errors
- [ ] `npm run lint` — passes (warnings OK, errors NOT)
- [ ] `npx prisma validate` — passes
- [ ] No hardcoded secrets (grep for API keys, passwords, connection strings)
- [ ] Every API route touched: tested with valid data → correct response
- [ ] Every API route touched: tested with invalid data → proper error message
- [ ] Every API route touched: tested without auth → 401/403
- [ ] Every protected route: tested with wrong role → 403

## Frontend (375px viewport — test EVERY page touched)

- [ ] No console errors on any page
- [ ] All tap targets ≥ 44px
- [ ] Loading states present (no blank flashes)
- [ ] Error states show user-friendly messages
- [ ] Empty states handled (no blank screens)

## Navigation

- [ ] Every page reachable from dashboard or natural user flow
- [ ] Back button works on all pages
- [ ] Auth redirects work (unauthenticated → sign-in → back to page)
- [ ] Deep links work (paste URL → correct page loads)

## Dave (Organizer) Flow

- [ ] Landing page → sign up → dashboard works
- [ ] Create pool → template loads → categories correct
- [ ] Category editor → rename persists
- [ ] Category editor → add golfer works
- [ ] Category editor → remove golfer works
- [ ] Pool created → invite code generated → copy works
- [ ] Pool management accessible from dashboard
- [ ] Member list loads → paid checkbox toggles
- [ ] Status transitions work (SETUP → OPEN)

## Mike (Player) Flow

- [ ] Invite link → pool info displays correctly
- [ ] Join → PoolMember created → redirect works
- [ ] Duplicate join → no error, redirects
- [ ] Make picks → categories in order → tap to select
- [ ] Already-picked golfer greyed out in other categories
- [ ] Summary bar shows progress
- [ ] Submit → confirmation → entry created in DB
- [ ] Edit picks (pre-deadline) → pre-fills → saves correctly
- [ ] Leaderboard accessible → entries ranked → My Entry highlighted
- [ ] Leaderboard tap-to-expand → shows picks with golfer scores

## Regression (even if untouched)

- [ ] Landing page still works
- [ ] Auth flow still works
- [ ] Pool creation still works
- [ ] Invite/join still works
- [ ] Pick submission still works
- [ ] Leaderboard still works

## Result

- [ ] ALL items above checked
- [ ] Zero P1 blockers
- [ ] P2/P3 issues documented in DEVIATIONS.md
