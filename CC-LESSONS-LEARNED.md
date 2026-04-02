# CC-LESSONS-LEARNED.md — Do Not Repeat These Mistakes
### Read this at the start of EVERY session. This is not optional.

---

## Purpose

This file captures mistakes made in previous CC sessions. Each entry describes what went wrong, why, and the rule to follow going forward. If you make a mistake that's already documented here, that is a critical failure.

---

## Lesson 1: Test With Fresh State, Not Existing State
**Date:** March 31, 2026
**What happened:** CC tested picks flow on a pool that already had entries. Picks worked for editing existing entries but broke when creating a new entry on a fresh pool. The regression shipped.
**Why:** CC reused test state from a previous session instead of testing the first-time user experience.
**Rule:** Every session's regression check must include a **fresh-state test**: create a new pool, join as a new user, submit picks for the first time. Never test only against pools/users that already have data.

---

## Lesson 2: Commits That Aren't Deployed Don't Count
**Date:** March 31, 2026
**What happened:** Stabilization Round 1 completed all fixes but changes were never committed to git or deployed to Vercel. CC reported "FIXED" based on local file state. The founder tested production and found the pre-fix version.
**Rule:** "Fixed" means deployed to a URL and verified at that URL. Before reporting any bug as fixed, verify: (1) changes are committed, (2) changes are pushed, (3) Vercel deploy completed, (4) the fix works at the deployed URL.

---

## Lesson 3: Fixing One Thing Must Not Break Another on the Same Page
**Date:** March 31, 2026
**What happened:** Stabilization Round 2 added a post-submission success screen to the picks page. The changes broke the golfer selection UI — an "X" icon replaced the selection radio buttons for all golfers. CC fixed the new feature but broke the existing feature on the same file.
**Rule:** Before modifying any file, read the ENTIRE file. After modifying, verify ALL functionality on that page — not just the part you changed. If the file has a selection UI, test selection. If it has a form, test submission. If it has navigation, test navigation. Test the whole page, not just your diff.

---

## Lesson 4: Self-Reported QA Is Not Verification
**Date:** March 31, 2026
**What happened:** CC filled out QA checklists marking items as "PASS" that were objectively broken in production. The leaderboard was marked "accessible" when no link to it existed on any page.
**Rule:** QA verification must produce evidence: flow traces describing what a user sees, commit SHAs, preview URLs. "PASS" without a description of what was actually tested and observed is not acceptable.

---

## Lesson 5: Navigation Must Be Tested End-to-End, Not Page-by-Page
**Date:** March 31, 2026
**What happened:** The leaderboard page existed at `/pool/[id]/leaderboard` and rendered correctly when accessed directly. But no link or button on any other page pointed to it. CC verified the page rendered — not that a user could find it.
**Rule:** When building or verifying navigation, test the complete chain: can a user get from the dashboard to this page without typing a URL? If not, the page is unreachable regardless of whether it renders.

---

## Lesson 6: Timezone Bugs Are Real
**Date:** March 31, 2026
**What happened:** The picks deadline was stored as a raw datetime-local string and compared on the server in UTC. On Vercel (UTC), the deadline appeared to have already passed when it hadn't in the user's local timezone. Picks could not be saved.
**Rule:** ALL datetimes must be stored and compared using `.toISOString()`. No raw datetime-local strings. No `new Date(stringWithoutTimezone)`. Convert to ISO at the point of form submission, store as ISO, compare as ISO.

---

## How to Use This File

1. **Read every lesson before starting work.** Not skimming — reading.
2. **Before submitting Gate B**, check your work against every lesson:
   - Did I test with fresh state? (Lesson 1)
   - Are my changes committed and deployed? (Lesson 2)
   - Did I test the full page, not just my changes? (Lesson 3)
   - Am I providing evidence, not just checkboxes? (Lesson 4)
   - Can a user navigate to every page I built? (Lesson 5)
   - Am I handling datetimes correctly? (Lesson 6)
3. **When a new mistake is discovered**, Jeff or Claude will add it here. Check for updates at session start.

---

*Edge Pools | CC-LESSONS-LEARNED.md | March 31, 2026*
*This file grows over time. Every mistake is documented once and never repeated.*
