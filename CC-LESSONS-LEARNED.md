# CC-LESSONS-LEARNED.md
## TILT (Edge Pools) | Accumulated Build Knowledge | Started: March 31, 2026
### Read this alongside CLAUDE.md at the start of every build session.

---

## Purpose

CLAUDE.md has the rules. This file has the experience. Every lesson here was learned from a real build failure, regression, or discovery across the rebuild sessions. The next session should not repeat mistakes from previous sessions.

**How this file grows:** After every build session, any new lesson gets appended to the relevant section with the session name and date. This file only gets longer.

---

## 1. TESTING LESSONS

### Test With Fresh State, Not Existing State
- Always test first-time user experience on a new pool/user, not reused data.
- Session 3 picks regression was invisible when testing with an existing entry but broke on a fresh OPEN pool with no entries. (R3, Apr 1)

### Self-Reported QA Is Not Verification
- QA must produce evidence (flow traces, SHAs, URLs). "PASS" without proof is not acceptable.
- Three stabilization sessions reported "FIXED" on bugs that were never committed, never deployed, or actively broken. This is why the Gate system replaced checklists. (Pre-rebuild, Mar 31)

### Test All Pool Statuses, Not Just OPEN
- Every page renders differently across SETUP → OPEN → LOCKED → LIVE → COMPLETE → ARCHIVED. If you only test OPEN, you miss broken states.
- STATE-MATRIX.md is the canonical reference. Every conditional in the UI traces back to it. (R1, Apr 1)

### Test at 375px AND 1440px
- Mobile-first doesn't mean desktop-never. Session 4 P2 pages looked acceptable on mobile but were uncentered and blown out on desktop — no max-width containers applied. (R4, Apr 2)

### Configuration Issues Look Like Missing Features
- P0 scoring had "no UI at all" but the code was correct — the pool wasn't in LIVE status. Always check state/config before assuming code is broken.
- If a feature appears missing, verify pool status, user role, and config values before writing new code. (P0 scoring crisis, Apr 8)

---

## 2. CODE QUALITY LESSONS

### Commits That Aren't Deployed Don't Count
- "Fixed" means committed, pushed, deployed, and verified at the live URL.
- Stabilization Round 1 had fixes that were never committed. Round 2 discovered Round 1 was uncommitted. (Pre-rebuild, Mar 31)

### Fixing One Thing Must Not Break Another on the Same Page
- Read the ENTIRE file before modifying. Test ALL functionality on the page, not just your diff.
- Session 3 picks fix broke the leaderboard fetch — cascading failure from a shared API pattern. (R3, Apr 1)

### Page.tsx Under 200 Lines
- Extract complexity to `_components/`. No hard limit on component files.
- Long page files are where regressions hide — hard to review, easy to break. (Standing rule, CLAUDE.md)

### Read Full File Before Modifying
- If you're changing ANY part of a file, read the entire file first. This prevents regressions.
- Multiple instances of CC modifying one function and unknowingly breaking another in the same file. (R1-R3, Apr 1)

### Truncation Hides Content, Not Just Text
- Flags on desktop were always rendered but clipped by CSS `truncate`. Root-cause fix (`break-words`) solved both the flag visibility and the name display in one change. Always check if a display bug is actually a CSS overflow issue before adding new rendering logic. (QA Batch 2, Apr 4)

### Merge Before Building Next Session
- Sessions must merge sequentially. Session D was wiped when Session B shipped to main first.
- Always merge the current session before starting the next one. Parallel branches risk data loss. (Session D wipe, Apr 9)

---

## 3. NAVIGATION LESSONS

### Navigation Must Be Tested End-to-End, Not Page-by-Page
- If a user can't reach a page from the dashboard without typing a URL, it's unreachable.
- Original build had leaderboard unreachable from pool pages — no PoolNav, no links. (Pre-rebuild, Mar 31)

### PoolNav Must Be in Layout, Not Per-Page
- Pool-level nav (Picks, Leaderboard, My Entries, Manage) lives in `src/app/pool/[id]/layout.tsx`. If it's in individual page files, some pages will miss it.
- The rebuild fixed this structurally — layout-level component means you can't be on a pool page without seeing the nav. (R1, Apr 1)

### Manage Tab Only Visible to Organizer
- Non-organizers should not see the Manage tab in PoolNav. Check `PoolRole.ORGANIZER` for the current pool.
- Admin = organizer for MVP. No separate admin role. (Standing rule)

---

## 4. DATA & API LESSONS

### Timezone Bugs Are Real
- All datetimes stored and compared using `.toISOString()`. No raw datetime-local strings.
- Picks deadline enforcement broke when comparing local datetime strings vs. UTC. (Pre-rebuild, Mar 30)

### Invalid Date Display
- If a datetime field is null, missing, or unparseable, display "—" not "Invalid Date."
- Session 4 manage page showed "Picks are open until Invalid Date" because picksDeadline was null in test data. (R4, Apr 2)

### API Routes Must Validate Pool Membership
- Every pool-specific API route must verify the requesting user is a member of that pool.
- Organizer-only routes must additionally check `PoolRole.ORGANIZER` for that specific pool.
- Cross-pool admin access (golfer mapping, manual scores): check if user is organizer of ANY pool. (Standing rule)

### No-Reuse Logic Is Per-Entry, Not Per-User
- In multi-entry pools, the no-reuse rule (can't pick the same golfer in two categories) applies WITHIN each entry, NOT across entries.
- Entry 1 and Entry 2 can both pick Scheffler — just not in two categories within the same entry. (D4, locked Mar 29)

### Data Often Exists Before the UI Renders It
- Thru status and hole-by-hole data were already being fetched by the scoring service. The fix was wiring existing data to display components, not adding new API calls.
- Before building a new fetch, check if the data already exists in an existing response. (Scorecards + thru status, Apr 8)

### Audit API Response Shapes Before Building Features
- SlashGolf photo audit checked 20+ endpoints. Knowing what an API doesn't have prevents wasted build time.
- If you need a data field, verify it exists in the API response first. Don't build UI around assumed data. (SlashGolf audit, Apr 8)

---

## 5. UI/UX LESSONS

### Placeholder Pages Are Not Acceptable
- A page that shows nothing (blank screen, "coming soon") is a broken page from the user's perspective. If a page exists in the nav, it must show useful content or redirect.
- Session 4 manage page was a blank placeholder until CC was told to build a minimal version. (R4, Apr 2)

### Loading + Success + Error States on Every Action
- Silent failures are P1. If a user taps something and nothing happens, the product is broken.
- Every user action has three states: idle, loading, result (success or error). (Standing rule, CLAUDE.md)

### Multi-Entry UI Must Be Invisible When maxEntries = 1
- When a pool allows only 1 entry (the default), no entry numbering, no "Add Another Entry" button, no "Entry 1 of 1" label. Just "Your Picks."
- Multi-entry complexity should only appear when the organizer opts into it. (D4/R4, Apr 2)

### Horizontal Scroll Strips Must Work on Mobile
- CSS `overflow-x: auto` with `-webkit-overflow-scrolling: touch` for momentum scrolling.
- No horizontal scroll on the PAGE itself — only within designated strips.
- Pick strips, category previews, and metric strips use this pattern. (Design spec, Apr 2)

### Read-Only vs. Interactive Toggles
- System-derived states (Invited, Signed Up, Picks) should not be manually togglable. Only commissioner-tracked fields (Paid) should be interactive.
- CC made this call correctly as a deviation but should have documented it in DEVIATIONS.md. If a deviation is the right call, still document it. (QA Batch 1, Apr 4)

### Sticky Mobile Bars Need Spacers
- A fixed-position bottom bar will cover the last row of scrollable content. Always add a spacer element (`h-20`) matching the bar height so all content is reachable.
- Mobile submit button was hidden behind the picks grid's bottom content. (QA Batch 2, Apr 4)

### Stacked Fixed Elements Need Explicit Z-Index Tiers
- When stacking fixed-position elements (submit bars, nav bars, modals), each needs its own z-index tier and explicit bottom offset. Two elements at the same z-index and position will occlude — the last one in DOM order wins.
- Always assign distinct z-index values and coordinate bottom offsets so lower bars sit above higher bars without overlap. (Apr 13)

---

## 6. DESIGN SYSTEM LESSONS

### Font Stack Is Montserrat + Space Mono (Updated Apr 10)
- **Montserrat** for all UI text (headers, nav, column headers, body, labels, buttons).
- **Space Mono** for scores, ranks, and numeric data columns only.
- Space Grotesk and Work Sans were replaced during the gold rebrand (Apr 10).
- No additional fonts. No serifs. No generic fonts (Inter, Roboto, Arial, system-ui).
- CC defaults to system fonts or Inter when no design direction is given. The design spec prevents this. (Design system, Apr 2; gold rebrand, Apr 10)

### Warm Cream Background, Never Pure White
- Brand pages use `#FDF8EE`. In-app pages use `#F8F7F5`. Pure white (`#FFFFFF`) is only for cards and elevated elements.
- This is the single most visible design decision — if it's wrong, every page looks wrong. (Design spec, Apr 2; updated Apr 10)

### No Cold Grays
- All gray values must have warm undertone. The color tokens in the design spec use warm grays (#E2DDD5, #6B6560, #A39E96).
- Tailwind's default gray scale is cold. Don't use `gray-100`, `gray-200`, etc. — use the custom tokens. (Design spec, Apr 2)

### Max-Width Containers on Every Page
- Content: 720px. Leaderboard: 800px. Landing hero: 960px. Picks grid: full width.
- Desktop without max-width looks broken — content stretches to 1440px and becomes unreadable. (R4 phone test, Apr 2)

### Status Badge Colors Are Exact
- SETUP: gray. OPEN: amber (#FDF4E3 / #8A6B1E). LOCKED: gray. LIVE: red (#FCEAE9 / #8B2D27). COMPLETE: teal (#E8F3ED / #1B5E3B). ARCHIVED: gray.
- These are not suggestions — CC must use these exact values. (Design spec, Apr 2)

### Score Colors Follow Meaning — And Are Permanent
- Under par: accent-success (#2D7A4F). Over par: accent-danger (#A3342D). Even par: text-secondary (#6B6560).
- %ToWin: accent-secondary/gold (#C4973B). Cut%: amber for at-risk, red for high-risk, green for safe.
- Color = meaning, never decoration. Score green/red are NEVER themed — they are permanent. (Design spec, Apr 2; D95, Apr 10)

### Theme Color Restraint: 4 Positions Only
- Theme accent color applies to exactly 4 surgical positions: table header, entry links, active nav indicator, More drawer background.
- Everything else (position numbers, star icons, controls, filters, round selectors) is neutral gray.
- Gold everywhere ≠ good. The Masters app uses green in 3-4 surgical spots. Over-applying theme color makes it feel decorative, not intentional. Restraint > saturation. (Gold rebrand, Apr 10)

---

## 7. BUILD SESSION PATTERNS

### Visual-Only Sessions Must Not Touch Logic
- When a session brief says "visual pass only," that means CSS, typography, layout, and component styling.
- Do NOT change API routes, database queries, business logic, state transitions, or scoring.
- If a visual change requires a logic change, STOP and document in DEVIATIONS.md. (Design system session, Apr 3)

### P1/P2 Split — Complete P1 Before Starting P2
- When a brief splits into P1 (must ship) and P2 (ship if time), finish ALL of P1 before touching P2.
- Do not partially implement P2 items — each P2 item should be complete or not started.
- Session 4 followed this correctly. (R4, Apr 2)

### Preview Branch Before Main — Always
- Push to a named branch. Vercel generates a preview URL. Jeff tests on his phone. If it passes, merge to main.
- Never push directly to main. Gate B exists because CC's self-reported QA is unreliable. (Gate system, Mar 31)
- Homepage redesign was pushed to main (bd3e549) skipping Gate B. Even when Jeff approves skipping the phone test, the branch should exist for rollback. (Homepage redesign session, Apr 4)

### Rollback Branches for Multi-Phase Visual Changes
- When shipping a major rebrand or multi-phase visual change, create a rollback branch before each phase.
- Gold rebrand shipped in 3 phases to main without preview — rollback branches existed for P2 (rebrand-p2-landing) and P3 (rebrand-p3-inapp). Pattern should not repeat for logic changes. (Gold rebrand, Apr 10)

### New CC Session for Each Brief
- Clean context = fewer regressions. Each session brief is self-contained.
- Don't continue a CC session after a brief is complete — start fresh for the next one. (Standing practice, Apr 1)

### Verify Mandatory Session Files Exist in Repo Before Starting
- All four mandatory session files (CLAUDE.md, CC-LESSONS-LEARNED.md, QA-PROTOCOL.md, STATE-MATRIX.md) must actually exist in the repo before building. STATE-MATRIX.md was missing from the repo — discovered mid-build during picks visual upgrade. Missing files should be flagged at Gate A, not discovered mid-build. (Picks visual upgrade session, Apr 4)

---

## 8. DEVIATION DOCUMENTATION

### Document Every Deviation
- If the build differs from the brief in ANY way, document it in DEVIATIONS.md.
- What the spec said → what you found → what you did instead → why.
- Do NOT silently correct deviations. Jeff needs to know what changed and why. (Standing rule, CLAUDE.md)

### Good Deviations Exist
- SSE downgraded to client-side polling due to Vercel serverless limits — correct call, properly documented.
- Not every deviation is a failure. But undocumented deviations are always a failure. (R3, Apr 1)

---

## 9. VERIFICATION PROTOCOL (Established Apr 12)

### Every Spec Requires Three Verification Sections
- **FT (Flow Trace):** Step-by-step tap→see→verify for every user interaction
- **SM (State Matrix):** Verify correct behavior per pool status
- **REG (Regression):** Confirm all existing features still work
- CC must run all FT/SM/REG checks after building, before reporting "ready for Gate B." No separate verification prompt needed.

### "All Buttons on Landing Pages" Includes Modals/Popups
- When a spec says "all buttons on landing pages," check modals and popups on those pages too — they're part of the page.
- QA cleanup caught popup buttons not matching the global button style because they were treated as separate from the page. (QA Cleanup, Apr 12)

### Fix Both Parent AND Child Row Grids
- When fixing alignment in expandable rows, fix both the parent row and the child/expanded row grids. Fixing only one leaves the other misaligned.
- QA-018 column alignment was partially fixed because only child rows were updated. (QA-018, Apr 12)

### Grep for Duplicate Renderers Before Removing UI Elements
- When removing a UI element, grep the full codebase for duplicate renderers. Components can be rendered from multiple sources (layout, page, shared component).
- QUICK-010 removed an element from one renderer but it still appeared via another. (QUICK-010, Apr 12)

### Auto-Show Logic Must Handle First-Visit / Incognito
- Absence of a localStorage flag means SHOW, not HIDE. Incognito browsers have no stored flags — the popup should fire.
- QA-019 onboarding popup wasn't showing for unauthenticated first-time visitors because the logic assumed no flag = already seen. (QA-019, Apr 12)

### Removed Config Options Need Migration or Defaults
- Existing pools with removed config options will show blank selections. For MVP test pools this is fine; for production commissioners, provide migration script or fallback defaults.
- Scoring config regression (QA-017) showed new options but lost old ones. (QUICK-009, Apr 12)

---

## Appendix: Session Build Log

| Session | Date | Scope | Key Lesson |
|---|---|---|---|
| Original Phases 1-4a | Mar 29 | Full stack in one marathon | Speed over quality caused rebuild. No testing between phases. |
| Stabilization 1 | Mar 31 | Bug fixes | Fixes never committed. "FIXED" was a lie. |
| Stabilization 2 | Mar 31 | Bug fixes | Found Stab 1 uncommitted. Fixed 4 bugs, introduced 1 regression. |
| Stabilization 3 | Mar 31 | Bug fixes | New regression in picks. Decided to rebuild. |
| R1 | Apr 1 | Pool shell + create + dashboard + shared UI | Clean session. Gate system worked. |
| R2 | Apr 1 | Invite + join + single-entry picks | Clean session. |
| R3 | Apr 1 | Leaderboard + mock scoring + entries | Picks regression on fresh pool. QA system installed after. |
| Picks redesign | Apr 1 | Grid replacing accordion | Clean. Grid is the product DNA. |
| R4 P1 | Apr 2 | Multi-entry + edit picks | Clean. Stepper, add entry, independent picks all work. |
| R4 P2 | Apr 2 | Unified UI polish | Functional but design quality low. Led to design system spec. |
| R4 Manage | Apr 2 | Minimal manage page | Placeholder was blank — built minimal functional version. |
| Design inputs | Apr 3 | Install design skills + reference | frontend-design skill is built-in (private repo). Others installed fine. |
| QA Batch 1 | Apr 4 | 6 fixes (email, toggles, copy, UI) | Read-only vs interactive toggles — system states aren't togglable. |
| QA Batch 2 | Apr 4 | 7 fixes (desktop email, submit bar, flags, widths) | CSS truncation hides content. Sticky bars need spacers. |
| D15-D18 polish | Apr 4 | TILT brand, referral, header, qualifiers | STATE-MATRIX.md was missing from repo. |
| Picks visual upgrade | Apr 4 | Earth-tone palette, auto-advance, bubbles | Verify mandatory files exist before starting. |
| Homepage redesign | Apr 4 | 76px TILT, role selector | Gate B skipped — branch should always exist for rollback. |
| Scorecards | Apr 8 | 18-hole grid, round selector | Data already existed — wired to display. |
| Thru status | Apr 8 | Inline thru on leaderboard | Same — existing data, new display. |
| SEO + format pages | Apr 9 | Meta tags, /classic, /quick-6, OG images, sitemap | Clean. |
| Commissioner setup | Apr 9 | Onboarding popup, transfer form, tournament dropdown, scoring config | Clean. |
| Guest picks + payment + celebration | Apr 9 | Guest picks, payment tracking, winner celebration, confetti | Clean. |
| Session C — Email invites | Apr 10 | Resend, PoolInvite, parse API, commissioner UI | Clean. Resend domain verified via Cloudflare autoconfig. |
| Landing page redesign | Apr 10 | Hero, CTAs, mini leaderboard, social proof, How It Works | Clean. |
| Testimonial redesign | Apr 10 | Soft gold cards, featured quote, green highlight | Gate B skipped — visual only, low risk. |
| Gold rebrand Phase 1 | Apr 10 | CSS vars, Montserrat swap (65+ files), wordmark, header/footer, hex sweep | Rollback branch missing for P1. Email template retains old hex (HTML limitation). |
| Gold rebrand Phase 2 | Apr 10 | Landing page gold treatment | Rollback branch: rebrand-p2-landing. |
| Gold rebrand Phase 3 | Apr 10 | In-app: leaderboard, BottomNav, MoreDrawer, theme routing | Rollback branch: rebrand-p3-inapp. |
| Scoring engine | Apr 10 | 14 files, pluggable architecture, strategy + roster + display | 7 deviations (SE-1–SE-7). Dispositioned Apr 12. |
| Field cleanup | Apr 10 | Quick-6 + Classic templates cleaned against SlashGolf 014 | Non-participants removed. |
| Payment tracker + thru | Apr 12 | Guest support in payment tracker + thru styling | Shipped to production (40f8d8c). |
| QA bundle | Apr 12 | 9 items: alignment, rename, buttons, email, menu, logo, scoring config, stale warning, pluralization | 5 passed Gate B, 4 failed → cleanup spec. (22276dd) |
| QA hotfix | Apr 12 | Onboarding popup + green buttons | P1 fix — popup wasn't firing for unauth visitors. (55e8697) |
| QA cleanup | Apr 12 | Team row alignment, email divider, stale warning | 3 remaining fails from bundle. (c4f7698, pending merge) |
| Manage redesign | Apr 12 | Grid members table, stat cards, filter pills | Preview (c86d998), pending Gate B. |
| Dashboard redesign | Apr 12 | 2-col card grid, status metrics | Preview (1590634), pending Gate B. |
| Grid aesthetic | Apr 12 | Create, invite, join pages | Preview (f4e5f1d), pending Gate B. |

---

*CC-LESSONS-LEARNED.md | TILT | April 13, 2026*
*This file grows with every build. Never delete lessons — only add.*
