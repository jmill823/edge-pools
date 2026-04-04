# Edge Pools — State Transition Matrix
### March 31, 2026 | Canonical Reference
### "State matrix is law" — every conditional in the UI traces back to this document.

---

## Pool Statuses

| Status | Meaning | Entered Via |
|---|---|---|
| SETUP | Organizer configuring pool | Pool creation |
| OPEN | Players can join and submit picks | Organizer activates from SETUP |
| LOCKED | Picks closed, tournament not started | Auto at picksDeadline, or organizer manual |
| LIVE | Tournament in progress, scores updating | Auto when scoring detects play, or organizer manual |
| COMPLETE | Results final | Auto when tournament ends |
| ARCHIVED | Historical record | Organizer action or auto 30 days post-COMPLETE |

---

## Allowed Transitions

```
SETUP → OPEN
OPEN → LOCKED
LOCKED → LIVE
LIVE → COMPLETE
COMPLETE → ARCHIVED
```

No other transitions. No backward transitions.

---

## Action Matrix: Who Can Do What

| Action | SETUP | OPEN | LOCKED | LIVE | COMPLETE | ARCHIVED |
|---|---|---|---|---|---|---|
| Edit pool settings | ✅ Org | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit categories | ✅ Org | ❌ | ❌ | ❌ | ❌ | ❌ |
| Share invite link | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ❌ | ❌ |
| Join pool | ❌ | ✅ Anyone* | ❌ | ❌ | ❌ | ❌ |
| Submit/edit picks | ❌ | ✅ Members | ❌ | ❌ | ❌ | ❌ |
| View own picks | ❌ | ✅ Owner | ✅ Owner | ✅ All | ✅ All | ✅ All |
| View all entries | ❌ | ❌ | ✅ Org | ✅ All | ✅ All | ✅ All |
| View leaderboard | ✅ Empty | ✅ List | ✅ List | ✅ Live | ✅ Final | ✅ Final |
| Toggle paid checkbox | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ✅ Org | ❌ |
| Toggle accepting members | ✅ Org | ✅ Org | ❌ | ❌ | ❌ | ❌ |
| Change pool status | →OPEN | →LOCKED | →LIVE | — | →ARCHIVED | — |
| Poll scores | ❌ | ❌ | ❌ | ✅ Org | ❌ | ❌ |
| Confirm WD replacement | ❌ | ❌ | ❌ | ✅ Org | ❌ | ❌ |
| Manual score entry | ❌ | ❌ | ❌ | ✅ Org | ❌ | ❌ |

*Join requires `acceptingMembers = true`

**Key:** Org = pool organizer. All = all pool members. Owner = entry owner only.

---

## Leaderboard Content by Status

| Status | What the Page Shows |
|---|---|
| SETUP | "Pool is being set up. Check back when picks are open." |
| OPEN | "Picks are open until [deadline]." + submitted entries list (if any) |
| LOCKED | "Picks locked. Waiting for [tournament] to begin." + entry list with picks visible |
| LIVE | Full ranked leaderboard with scores. My Entry highlighted. Tap to expand. |
| COMPLETE | Final results. Full pick transparency. Winner highlighted. |
| ARCHIVED | Same as COMPLETE (read-only). "This pool has been archived." banner. |

---

## Page Visibility by Role

| Page | Organizer | Player (member) | Non-member |
|---|---|---|---|
| Dashboard | ✅ All pools | ✅ Joined pools | ✅ Empty state |
| Create Pool | ✅ | ✅ | ❌ Auth required |
| Pool Invite/Join | ✅ | ✅ | ✅ Public (auth on join) |
| Picks | ✅ | ✅ | ❌ Redirect to join |
| Leaderboard | ✅ | ✅ | ❌ Redirect to join |
| My Entries | ✅ | ✅ | ❌ |
| Manage Pool | ✅ | ❌ 404/redirect | ❌ |
| Admin tools | ✅ If org of any pool | ❌ 403 | ❌ 403 |

---

## Dashboard Pool Card Links

| Status | Organizer Links | Player Links |
|---|---|---|
| SETUP | Manage, Leaderboard | — |
| OPEN | Manage, Leaderboard | Picks (if no entry), Leaderboard |
| LOCKED | Manage, Leaderboard | Leaderboard, My Entries |
| LIVE | Manage, Live Leaderboard | Live Leaderboard, My Entries |
| COMPLETE | Manage, Results | Results, My Entries |
| ARCHIVED | View Archive | View Archive |

---

## ARCHIVED Status Detail

| Behavior | Rule |
|---|---|
| Leaderboard | Final results, read-only, same as COMPLETE |
| Picks | Read-only view of submitted picks |
| My Entries | Read-only list with expand |
| Manage | Read-only member list. No toggles. "This pool is archived." |
| Invite links | Resolve to pool info with "This pool has ended." No join button. |
| Dashboard | Appear in collapsed "Past Pools" section below active pools |

---

## Role Definition (MVP)

**Admin = Organizer.** No separate admin role in schema or auth.

`PoolRole` enum: `ORGANIZER` | `PLAYER`

Permissions are per-pool. A user can be organizer of Pool A and player in Pool B.

Cross-pool admin access (golfer mapping, manual scores): check if user is organizer of ANY pool.

---

*Edge Pools | STATE-MATRIX.md | March 31, 2026*
*This is the canonical reference. When in doubt, this document wins.*
