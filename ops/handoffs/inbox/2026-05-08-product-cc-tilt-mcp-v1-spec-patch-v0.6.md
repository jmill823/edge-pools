# Handoff: TILT MCP v1 — Spec patch v0.6 + Day 3 prep

**From:** Product Agent
**To:** CC
**Date:** 2026-05-08
**Type:** Mid-sprint spec patch + next-day prep
**Build repo:** `github.com/jmill823/edge-pools`
**Spec:** `ops/specs/pending/tilt-mcp-v1.md` (v0.6, attached)
**Replaces:** `ops/handoffs/inbox/2026-05-06-product-cc-tilt-mcp-v1-kickoff.md` (v0.5)

---

## Day 2 work approved

CC's Day 2 build report received and reviewed. Six deviations all
accepted. Three Product confirmations supplied:

1. **`field_pending` semantics:**
   - `ready` = field loaded AND scoring engine configured AND tournament dates active
   - `field_pending` = tournament exists, player field not loaded yet
   - `scoring_pending` = field loaded but scoring not wired up (rare)
   - `unsupported` = tournament not in system

   If the existing data model doesn't have a clean signal for "scoring
   engine configured," collapse `scoring_pending` into `ready` — don't
   invent new state.

2. **Tool description placeholders:** accepted for Gate B preview. Final
   commissioner-language descriptions land Day 4 (Jeff's polish session)
   BEFORE Day 5 registry submissions. Don't submit to registries with
   placeholder copy.

3. **Push to preview branch:** approved. Run Gate B verification on the
   preview branch.

### Two watch-items to address before Day 3

**Watch-item 1: dev-bypass security.** Add a startup check that throws
if `MCP_DEV_BYPASS_TOKEN` is set in `NODE_ENV=production`. Belt-and-
suspenders to prevent a misconfigured deploy from leaving dev-bypass
active in prod.

**Watch-item 2: `last_seen` field name.** Rename the response field on
`late_pickers` output from `last_seen` to `joined_at` to match the actual
data semantics. The proxy substitution noted in DEVIATIONS is fine, but
the field name should match what's returned, otherwise the agent will
misrepresent it to commissioners.

Both are small. Land them with the v0.6 patch.

---

## v0.6 spec patch — auth model pivot

Jeff checked the Clerk dashboard 2026-05-08. Clerk tenant is on **Free
tier** with no OAuth Applications feature available. Rather than upgrade
the Clerk plan, **the spec pivots to Personal Access Token (PAT) auth.**

### Why this is the right call

- Standard pattern (GitHub PATs, Anthropic API keys, OpenAI API keys)
- Works on Clerk's current plan
- Smaller surface than OAuth integration → less Day 4 risk
- Reversible: post-PGA, Clerk OAuth Applications can be added as an
  *additional* install method without disrupting PAT users

### What changes (full detail in v0.6 spec § Auth model)

**Token lifecycle:**

1. Commissioner logs into `playtilt.io`, navigates to Settings → API
   tokens, clicks "Generate new token", optionally names it
2. Server generates a high-entropy random string (32+ bytes,
   urlsafe-base64, with `tilt_pat_` prefix), stores its hash (bcrypt or
   argon2), returns plaintext to the UI **once**
3. Commissioner copies the PAT, pastes it into Claude Desktop's MCP
   server config (alongside the `playtilt.io/api/mcp` URL)
4. Every MCP request includes `Authorization: Bearer <pat>` — server
   hashes presented token, looks up against `MCPToken` table, verifies
   not revoked, updates `lastUsedAt`, resolves to commissioner's `userId`
5. Commissioner can revoke tokens any time from the settings page

**New files (added to v0.5 file list):**

- `src/app/api/mcp-tokens/route.ts` — POST creates a PAT (returns
  plaintext once), GET lists token metadata, DELETE revokes by id.
  Web-session-authed (Clerk session middleware applies, **not** the
  MCP bypass).
- `src/app/(app)/settings/api-tokens/page.tsx` — token-management UI.
  Confirm the `(app)` route group exists; if the settings folder is
  elsewhere in the existing app, place it consistently.
- `prisma/schema.prisma` — **scoped exception** to "Files NOT to touch":
  add ONE new model `MCPToken { id, userId, name, tokenHash,
  lastUsedAt, createdAt, revokedAt }`. No other schema changes permitted.
  Run a Prisma migration cleanly.

**Existing file changes:**

- `src/app/api/mcp/auth.ts` — was Clerk OAuth bridge. Now: PAT
  validation. Extract Bearer token → look up by hash → verify not
  revoked → resolve userId → attach to request context. Also enforce
  the dev-bypass security check (watch-item 1 above).
- `src/middleware.ts` — your existing bypass for `/api/mcp/*` is
  correct. Confirm `/api/mcp-tokens/*` stays Clerk-protected (it should
  by default since it's not in the bypass).
- `src/app/mcp/page.tsx` (Day 5 work) — landing-page copy reflects PAT
  install flow: "Generate a token in your Tilt settings, paste it into
  Claude Desktop's MCP config" — example shown.

**New SM checks added in v0.6:**

- **SM-008** Request to `/api/mcp/*` with no `Authorization` header →
  401 with hint pointing at `/settings/api-tokens`
- **SM-009** Request with revoked PAT → 401 with hint
- **SM-010** Plaintext PAT shown exactly once on generation; subsequent
  visits show only metadata

**FT-001 rewritten** for PAT install flow (vs. OAuth flow).

### Sprint timeline impact

Day 3 work expanded to include the PAT generation API + settings UI
(pulled forward from Day 4 to derisk Day 4 density):

| Day | Date | Focus |
|---|---|---|
| 3 | May 9 | Local install + dogfood with Masters 2026 data using **dev-bypass token**. **Build PAT generation API (`/api/mcp-tokens/`) + settings UI alongside.** Schema migration for `MCPToken`. |
| 4 | May 10 | Auth bridge real (PAT validation in MCP route, replacing dev-bypass). Write tools (`add_players`, greenfield `nudge_late_pickers` + new Resend template). Jeff's tool-description polish session. |

Day 4 risk is now lower than the v0.5 plan because PAT validation is
~30 lines instead of an OAuth integration. The schema change and
settings UI are net new but they're isolated, well-bounded work.

### Slip plan (unchanged)

If Day 4 runs over, drop `nudge_late_pickers` to v1.1. Five-tool launch
acceptable. PAT auth itself is in scope and not droppable — without it,
nothing else works.

---

## What CC does next

### This session
1. Save the attached v0.6 spec to `ops/specs/pending/tilt-mcp-v1.md`,
   overwriting v0.5.
2. Save this handoff to `ops/handoffs/inbox/`, replacing the v0.5 kickoff.
3. Address the two watch-items from Day 2 (dev-bypass production guard,
   `last_seen` → `joined_at` rename).
4. Push to preview branch. Run Gate B verification.

### Day 3 (May 9)
1. Local install + dogfood with Masters 2026 data using dev-bypass token.
2. Schema migration: add `MCPToken` model. Confirm migration runs
   cleanly against existing prod data shape.
3. Build `/api/mcp-tokens/` route (POST/GET/DELETE).
4. Build `/settings/api-tokens` page UI.
5. End-to-end test: generate a PAT in the UI, paste into a local Claude
   Desktop MCP config, hit a tool, verify the token resolves correctly.

### Day 4 (May 10)
1. Replace dev-bypass with real PAT validation in `src/app/api/mcp/auth.ts`.
2. Build write tools: `add_players` (wraps existing
   `/invites/send`), greenfield `nudge_late_pickers` primitive at
   `/api/mcp/internal/nudge` + new Resend template.
3. Build `replay_last_season` tool (was deferred from Day 2).
4. **Pause for Jeff's tool description polish session** (~1 hour, one
   block, not interleaved with build).

---

## Decisions you may make without coming back to Product

- PAT format details (length, prefix, encoding) — anything reasonably
  high-entropy works. Suggest 32+ random bytes, urlsafe-base64-encoded,
  `tilt_pat_` prefix for grep-ability
- Hash algorithm (bcrypt vs argon2 vs scrypt) — pick whatever your
  Prisma/Node setup already supports cleanly
- Settings UI styling — match the existing design system; don't invent
  new patterns
- Whether to use the existing Clerk session for the settings UI or any
  alternative — should be Clerk session, since that's what the rest of
  the authed app uses

## Decisions to bring back via Product handoff

- Any change to PAT lifecycle (e.g., adding expiration, scoped tokens,
  multi-org tokens, anything beyond the simple userId-bound model)
- Any change to the v1 tool surface
- Any new "Files NOT to touch" exception beyond the two already locked
  (Resend template for nudge, MCPToken schema addition)

## Decisions that block CC (must come from Jeff)

- Tool description final copy — Day 4 polish session

---

## File Manifest

| Path | Action |
|---|---|
| `ops/specs/pending/tilt-mcp-v1.md` | Overwrite v0.5 with v0.6 (attached) |
| `ops/handoffs/inbox/2026-05-08-product-cc-tilt-mcp-v1-spec-patch-v0.6.md` | This handoff |
