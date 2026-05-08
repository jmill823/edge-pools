# Handoff: TILT MCP v1 — Day 2 Build Report

**From:** CC
**To:** Product Agent
**Date:** 2026-05-07
**Type:** Build report
**Spec:** `ops/specs/pending/tilt-mcp-v1.md` (v0.5)
**Branch:** TBD (Gate B preview branch will be created when ready to merge)

---

## TL;DR

Day 2 scaffolding + 3 read tools complete. Build green, lint green, smoke
tests pass on local dev. JSON-RPC 2.0 dispatch live for `initialize`,
`tools/list`, `tools/call`, `ping`. All 6 tools enumerated in `tools/list`;
3 callable now (current_standings, late_pickers, market_coverage), 3
return a stable `tool_deferred_to_day_4` envelope. Public `market_coverage`
works without auth. Auth bridge is a stub with a dev-bypass path; real
Clerk OAuth still gated on Jeff's dashboard validation.

Six deviations documented in `DEVIATIONS.md` under "TILT MCP v1 — Day 2"
(MCP2-1 through MCP2-6). Most material ones: SDK not added (delegated to
CC by spec; will revisit Day 4); current_standings reads Prisma directly
to honor the "Files NOT to touch" rule; `last_seen` returns `joinedAt` as
useful proxy.

## What shipped

### Files created (12)
| Path | Purpose |
|---|---|
| `src/app/api/mcp/[[...slug]]/route.ts` | JSON-RPC 2.0 dispatcher |
| `src/app/api/mcp/auth.ts` | Bearer-token auth (stub + dev-bypass) |
| `src/app/api/mcp/idempotency.ts` | Write-path key store (scaffold only; Day 4 uses) |
| `src/app/api/mcp/log.ts` | Structured stdout logging |
| `src/app/api/mcp/lib/types.ts` | Shared type contracts |
| `src/app/api/mcp/lib/errors.ts` | Error code registry + JSON-RPC mapping |
| `src/app/api/mcp/lib/pii-strip.ts` | PII redaction for log records |
| `src/app/api/mcp/tools/current_standings.ts` | Tool 1 implementation |
| `src/app/api/mcp/tools/late_pickers.ts` | Tool 5 implementation |
| `src/app/api/mcp/tools/market_coverage.ts` | Tool 6 implementation |
| `src/app/api/mcp/public/coverage/route.ts` | REST mirror for market_coverage |
| `public/.well-known/mcp.json` | Discovery metadata |

### Files modified (1)
| Path | Change |
|---|---|
| `src/middleware.ts` | Added `/api/mcp/*` to the public-route bypass list |

### Files explicitly NOT touched (per spec § Files NOT to touch)
- `prisma/schema.prisma`
- `src/lib/auth.ts`
- `src/lib/scoring/*` (imported, not modified)
- `src/app/api/pools/[id]/leaderboard/route.ts`
- `src/app/api/pools/[id]/members/route.ts`
- `src/app/api/pools/[id]/invites/send/route.ts`
- `src/app/p/*`
- All Resend templates (Day 4 brings the one allowed exception)
- Clerk configuration

## Verification matrix

### FT (flow trace) — Day 2 scope only

| ID | Status | Evidence |
|---|---|---|
| FT-001 | DEFERRED Day 4 | Install flow needs the auth bridge |
| FT-002 | DEFERRED Day 4 | Pool-creation chain needs `replay_last_season` + `add_players` |
| FT-003 | PARTIAL | `tools/call current_standings` dispatch works end-to-end; full happy-path requires dev-bypass token + a real pool, runs Day 3 dogfood |
| FT-004 | PARTIAL | `late_pickers` dispatch works; `nudge_late_pickers` ships Day 4 |
| FT-005 | PARTIAL | Same as FT-003 — `current_standings` returns the structured payload an agent can reformat |
| FT-006 | **PASS** | Public funnel verified: `curl -X POST http://localhost:3000/api/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"market_coverage","arguments":{}}}'` returns 3 tournaments with status enum (Valero=field_pending, Masters=ready, RBC=ready). REST mirror at `/api/mcp/public/coverage` returns same. |

### SM (state matrix) — Day 2 scope

| ID | Status | Evidence |
|---|---|---|
| SM-001 | DEFERRED Day 4 | tier-gating not exercised by Day 2 read tools |
| SM-002 | **PASS** | `tools/call current_standings` without `Authorization` header → `auth_missing` (HTTP 401 envelope inside JSON-RPC result). Random Bearer (no env vars) → `auth_bridge_pending` (HTTP 503). |
| SM-003 | **PASS** | Public caller hits `market_coverage` → 200 OK with full list (verified above) |
| SM-004 | **PASS (logic)** | `requireOrganizer()` in `auth.ts` checks `pool.organizerId === commissionerId` and returns `forbidden_not_organizer` otherwise. Logic verified by inspection; full end-to-end test runs Day 3 with dev-bypass token. |
| SM-005 | DEFERRED Day 4 | tier-token coupling not exercised yet |
| SM-006 | DEFERRED Day 4 | rate-limit logic ships with `nudge_late_pickers` |
| SM-007 | DEFERRED Day 4 | batch-size check ships with `add_players` |

### REG (regression) — every Day 2 check

| ID | Status | Evidence |
|---|---|---|
| REG-001 | **PASS** | Existing playtilt.io flows: `GET /` returns 200, `GET /api/tournaments` returns full tournament list, `GET /api/pools/<id>/leaderboard` without auth returns 401 (unchanged behavior). Middleware change is additive — only adds `/api/mcp/` bypass. |
| REG-002 | **PASS** | Scoring engine is imported but not modified. `npm run build` compiles all existing scoring code unchanged. No GolferScore tables touched. |
| REG-003 | **PASS** | Payment-reminder modal not touched. Day 2 doesn't add or modify Resend templates. |
| REG-004 | **PASS** | `clerkMiddleware` still wraps the request handler. `isProtectedPage` matcher unchanged. Sign-in/sign-up flows untouched. |
| REG-005 | **PASS** | No changes to player-facing pick flow files. Confirmed `/p/...` paths and `/pool/[id]/picks` not in the change set. |

### Build/lint/types

| Check | Result |
|---|---|
| `npm run lint` | ✅ Zero warnings, zero errors |
| `npm run build` | ✅ Compiled successfully — both `/api/mcp/[[...slug]]` and `/api/mcp/public/coverage` registered as Functions |
| `npx prisma validate` | ✅ Schema unchanged |
| Hardcoded secrets | None added — `MCP_DEV_BYPASS_TOKEN` is read from env at runtime |

### Logging queryability

Spec § Signal instrumentation requires being able to answer "calls in last
7 days grouped by caller fingerprint and tool name" without reading a
markdown file. Implementation: structured JSON line per call to stdout,
tagged with `"tag":"mcp_call"`. Verified in dev:

```
{"tag":"mcp_call","ts":"2026-05-08T03:28:39.451Z","tool":"market_coverage","fingerprint":"Other","commissioner_id_hash":null,"input":{},"ok":true,"error_code":null,"latency_ms":778,"tier":"public"}
```

PII strip rule applied: `email`, `emails`, `name`, `displayName` redacted;
`pool_id`, `tournament_id`, `idempotency_key`, counts, error codes kept.

In production this routes to Vercel Functions logs. Query example for the
weekly Product summary handoff:
```
vercel logs --json --since 7d | jq 'select(.tag=="mcp_call") | {tool, fingerprint}' | sort | uniq -c
```

## Deviations (full detail in `DEVIATIONS.md`)

| ID | Summary |
|---|---|
| MCP2-1 | `@modelcontextprotocol/sdk` not added; JSON-RPC 2.0 implemented directly. Library choice is CC's per spec. |
| MCP2-2 | `current_standings` reads Prisma directly (does not HTTP-fetch existing leaderboard route). Required by "Files NOT to touch" rule. |
| MCP2-3 | `late_pickers.last_seen` returns `joinedAt` instead of null — useful proxy until a real last-seen column exists. |
| MCP2-4 | `market_coverage.field_pending` mapping rule documented (lastSyncAt-based proxy). |
| MCP2-5 | Auth stub with dev-bypass env vars ships Day 2 so Day 3 dogfood is unblocked. |
| MCP2-6 | Landing page + footer line still on Day 5 per spec timeline (not a real deviation; flagged for clarity). |

## Day 3 readiness

Day 3 (May 9) is local install + dogfood with Masters 2026 data. Jeff's
prerequisite for that session:

1. Set `MCP_DEV_BYPASS_TOKEN` to any random string in local `.env.local`
2. Set `MCP_DEV_COMMISSIONER_USER_ID` to Jeff's `User.id` from the DB
   (one query: `SELECT id FROM "User" WHERE email = '<Jeff's email>';`)
3. Run `npm run dev`
4. Call `current_standings` and `late_pickers` against a real Masters 2026
   pool ID with the dev-bypass token in the Bearer header

That's the dogfood loop until Day 4 ships the real Clerk OAuth bridge.

## Day 4 readiness — Clerk validation still outstanding

Spec § Day 0 prerequisite #3 still pending: Jeff's Clerk Dashboard
validation of OAuth Apps support. Result determines whether the auth
bridge uses Clerk OAuth (preferred) or an alternative path. Day 4 build
starts as soon as Jeff confirms.

## Items I did NOT improvise

Per the kickoff handoff "Decisions to bring back via Product handoff":
- No tool surface changes (schemas/descriptions/auth tier all match spec)
- No new exception to "Files NOT to touch" beyond the Day 4 Resend
  template (and that's not in this build — Day 4)
- The 25-batch limit on `add_players` will land Day 4 unchanged from spec
- No new v1 → v1.1 deferrals discovered

## Items requesting Product attention before Gate B merge

1. **Confirm `field_pending` semantics in MCP2-4** — my mapping uses
   `lastSyncAt === null` as the field-loaded proxy. If a more precise
   definition is preferred (e.g., "field_pending = no CategoryGolfer
   rows for any pool with this tournament"), say so before merge.

2. **Confirm tool descriptions are draft-acceptable** — placeholder
   copy from the spec is in `tools/list`. Day 4 polish session will
   replace. If you want different placeholder text in the meantime,
   say so before merge.

3. **Branch + PR creation** — I have not pushed a branch or opened a PR.
   The work is committed-ready on `main` working tree. Recommend creating
   `mcp/day2-scaffold-and-read-tools` branch off main, force-pushing
   the staged changes, and letting Vercel generate the preview URL for
   Gate B verification. Awaiting your go-ahead before doing so.

## File manifest

| Path | Action |
|---|---|
| `ops/specs/pending/tilt-mcp-v1.md` | Read (spec source of truth) |
| `ops/handoffs/inbox/2026-05-06-product-cc-tilt-mcp-v1-kickoff.md` | Read |
| `CLAUDE.md`, `STATE-MATRIX.md`, `QA-PROTOCOL.md`, `CC-LESSONS-LEARNED.md` | Read |
| `DEVIATIONS.md` | Appended Day 2 section (MCP2-1..6) |
| 12 new files + 1 modified file under `src/app/api/mcp/`, `src/middleware.ts`, `public/.well-known/mcp.json` | Created/modified |
| `ops/handoffs/inbox/2026-05-07-cc-product-tilt-mcp-v1-day2-report.md` | This report |
