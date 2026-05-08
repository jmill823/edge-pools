# Spec: TILT MCP Server v1

**Status:** pending
**Owner:** Product Agent
**Build Agent:** CC
**Source:** D201 (MCP-First Surface Strategy)
**Forcing function:** PGA Championship Round 1 — Thursday May 14, 2026
**Sprint window:** May 6 (today) → May 13 (live), 8 days
**Repo:** `github.com/jmill823/edge-pools` (live v1 web app — flat Next.js, not the `tilt-v2` monorepo skeleton)
**Revision:** v0.6 (2026-05-08) — see Changelog at end of file

---

## Goal

Ship a TILT MCP server that lets a commissioner run a pool from inside
their AI agent (Claude, ChatGPT, etc.) without touching playtilt.io for
routine pool ops (status checks, invites, nudges, replays). The web app
remains the player-side surface and the rich-leaderboard surface; the MCP
server is the commissioner-side control plane.

## Why now

Three time-pressure signals stacked:
1. MCP adoption mid-S-curve (100M → 300M monthly downloads, Jan → April 2026).
2. PGA Championship is the next forcing function on the calendar.
3. Slot competition for "default sports-pool primitive in agent toolkits"
   is currently zero.

Reversibility: the MCP server is additive. If signal is negative, deprecate
without affecting the web product.

## Day 0 prerequisites — STATUS

CC ran these on Day 1 and reported (see kickoff handoff response,
2026-05-06):

1. **API surface mapping — DONE.** Endpoints CC verified (path on left
   = what's in this spec; path on right = actual file in repo):
   - `current_standings` wraps `GET /api/pools/[id]/leaderboard`
     (`src/app/api/pools/[id]/leaderboard/route.ts`)
   - `add_players` wraps `POST /api/pools/[id]/invites/send`
     (`src/app/api/pools/[id]/invites/send/route.ts`)
   - `late_pickers` derives from `GET /api/pools/[id]/members`
     (filtered to `entriesSubmitted: 0`)
   - `nudge_late_pickers` has **no upstream primitive** — CC builds it
     greenfield under `/api/mcp/internal/nudge` plus a new Resend
     template (see Tool 4 below)

2. **API-blocking branches — CLEAR.** CC checked all 30+ remote
   branches against `main`. Every branch touching `src/app/api/` is
   either fully merged or stale (3-5+ weeks old, abandoned). The two
   exceptions (`session4-multi-entry`, `session-d-guest-picks`) are
   superseded by later work in `main`. Clear runway for `/api/mcp/`.

3. **Clerk Apps feature — RESOLVED (obsolete).** Jeff checked the Clerk
   dashboard 2026-05-08 and confirmed the tenant is on Free tier with no
   "OAuth Applications" feature available (Clerk gates third-party OAuth
   server behind Pro+ plans). **Decision: skip Clerk OAuth Applications
   entirely. Pivot to Personal Access Token (PAT) auth model — see Auth
   Model section below.** This change touches the auth model only; the
   tool surface, idempotency, rate limits, and tier model are unchanged.

## Scope

### In scope
- Six tools (four core + two read companions) listed in the Tool Surface section
- Personal Access Token (PAT) auth bridge: commissioners generate a PAT
  inside their Tilt account settings and paste it into Claude Desktop's
  MCP config during install (replaces prior plan to use Clerk OAuth
  Applications, which the tenant doesn't support on its current plan)
- Token-management UI on the web side: a small settings page where
  commissioners can generate, view, and revoke PATs
- Idempotency-keyed write paths for the two side-effect tools
- Tool descriptions written in commissioner-language (Product owns; Day 4 polish session)
- Server log instrumentation: every tool call recorded; storage mechanism CC's choice
  (must satisfy queryability requirement in Signal Instrumentation section)
- Distribution: Smithery + Anthropic MCP directory + Cursor registry
- Install URL: `playtilt.io/mcp` (locked 2026-05-06 — same Vercel project, no DNS work)
- Footer line on `playtilt.io` linking to install
- All new endpoints live under `/api/mcp/` (single folder; `/api/mcp/public/*` for
  public endpoints — public refers to auth, not URL location)

### Out of scope (explicit — defer to v1.1+)
- Player-side tools (`submit_picks`, etc.) — Phase 2
- Settlement tools (`compute_winnings`, `archive_pool`) — high-stakes, last to ship
- Multi-pool / power-user tools (`list_my_pools`, `compare_pools`)
- `what_if(...)` counterfactual scoring
- Generative-UI / structured-component returns
- Cross-product agent composition examples
- Renaming `edgle-pool` → `tilt`
- Player-facing experience changes of any kind
- Cold-email signature line copy (handed to Outreach Agent — separate handoff)

### Files to touch (edge-pools repo)

> **CC: confirm exact paths against the existing `src/` tree on Day 1.**
> The spec assumes a standard Next.js App Router layout (`src/app/...`).
> If the actual structure differs (e.g., `app/` at root, no `src/`
> wrapper), adjust paths consistently and surface the deviation to
> Product before scaffolding.

- `src/app/api/mcp/[[...slug]]/route.ts` — MCP server entry (NEW)
- `src/app/api/mcp/tools/*.ts` — one file per tool (NEW)
- `src/app/api/mcp/public/coverage/route.ts` — public coverage endpoint (NEW)
- `src/app/api/mcp/internal/draft-from-prior/route.ts` — replay_last_season backing (NEW)
- `src/app/api/mcp/internal/nudge/route.ts` — nudge_late_pickers backing primitive (NEW; no equivalent exists in the existing app)
- `src/app/api/mcp/auth.ts` — PAT validation: extracts `Authorization:
  Bearer <pat>` from MCP request, verifies token against `MCPToken`
  table, resolves to commissioner `userId`, attaches to request context
  (NEW)
- `src/app/api/mcp/idempotency.ts` — write-path idempotency keys (NEW)
- `src/app/api/mcp/log.ts` — call-log instrumentation (NEW)
- `src/app/api/mcp-tokens/route.ts` — POST creates a new PAT (returns
  plaintext token ONCE), GET lists token metadata, DELETE revokes by
  id. Web-session-authed (Clerk middleware), used by the settings UI (NEW)
- `src/app/(app)/settings/api-tokens/page.tsx` — token-management UI:
  list existing PATs by name + last-used + revoke button, "Generate new
  token" flow that displays the plaintext PAT once with copy-to-clipboard
  affordance (NEW; CC: confirm `(app)` route group exists; if the
  settings folder is elsewhere, place it consistently)
- `prisma/schema.prisma` — **scoped exception** to "Files NOT to touch":
  add one new model `MCPToken` with fields `id`, `userId`, `name`,
  `tokenHash` (bcrypt or argon2 of the plaintext PAT), `lastUsedAt`,
  `createdAt`, `revokedAt`. No other schema changes permitted (MODIFY)
- `src/middleware.ts` — add bypass for `/api/mcp/*` (MCP routes use PAT
  Bearer tokens, not Clerk session cookies); ensure
  `/api/mcp-tokens/*` stays Clerk-protected (so only logged-in commissioners
  can manage their own tokens) (MODIFY)
- `src/app/mcp/page.tsx` — install landing page (NEW; Day 5).
  Copy now reflects PAT install flow: "Generate a token in your Tilt
  settings, paste it into Claude Desktop's MCP config" — example shown
- `src/app/layout.tsx` — footer "Use Tilt from your AI assistant" line (MODIFY)
- `public/.well-known/mcp.json` — MCP discovery metadata (NEW)
- `package.json` — add `@modelcontextprotocol/sdk` dependency (MODIFY)

### Files NOT to touch (explicit)
- Existing scoring engine code (CC: locate on Day 1; likely under
  `src/lib/scoring/` or similar)
- Auth core (only the new MCP auth bridge file is allowed)
- Database schema (`prisma/schema.prisma`) — **EXCEPT:** one scoped
  addition allowed in v0.6 — adding the `MCPToken` model for PAT storage.
  This is a single new model; no fields added to existing tables, no
  modifications to existing models. Any further schema changes need a
  Product handoff before changing.
- Any player-facing UI (`src/app/p/[id]/picks/*` or equivalent)
- Resend templates — **EXCEPT:** one new "haven't picked yet" template
  is required for `nudge_late_pickers` (no existing pick-reminder
  template exists; the existing reminder modal is a payment-reminder
  client-side helper, unrelated). Outreach Agent owns final copy via
  separate handoff; CC scaffolds with placeholder copy.
- Clerk configuration (use existing app — PAT auth replaces the original
  plan to use Clerk OAuth Applications, which the tenant doesn't support)
- Existing web API endpoints under `src/app/api/` (other than the new
  `/api/mcp/*` tree and the new `/api/mcp-tokens/*` route)

## Tool Surface (v1.0)

### 1. `current_standings` — Wedge Tool
- **Auth:** Authenticated commissioner only (must be organizer of pool).
  Public-link / share-token reads deferred to v1.1 — the existing
  product has no `share_token` primitive on pools and adding one
  requires a schema change that's out of scope.
- **Tier:** Free + paid
- **Idempotency:** N/A (read)
- **Description (draft, polish Day 4):**
  > "Get the live leaderboard for a Tilt pool. Returns player rankings,
  > each player's golfer picks per category, and total points. Use when
  > the commissioner asks 'where are we', 'how's the pool', 'who's
  > winning', or wants a status snapshot to share with the group."
- **Schema:**
  - input: `{ pool_id: string }`
  - output: `{ tournament_status, players[] }`
    (the wrap layer reshapes the upstream payload — see "Wraps" below —
    but the agent-facing contract is the simpler `{tournament_status,
    players[]}`. CC: derive `tournament_status` from `tournament` and
    `onCourse`; flatten `entries[]` into `players[]` with rank, picks
    per category, total points.)
- **Wraps:** existing `GET /api/pools/[id]/leaderboard` (returns
  `{pool, tournament, templateName, onCourse, pendingReplacements,
  entries[], rosterRuleSummary}` — wrap layer transforms to the simpler
  agent-facing shape)
- **Deferred to v1.1:** `movement[]` (change since last check) requires
  storing point-in-time snapshots that don't exist today. Out of v1.

### 2. `replay_last_season` — Empty-State Collapse
- **Auth:** Authenticated commissioner only (organizer role required on
  the prior pool referenced)
- **Tier:** Free (limited to 1 active pool) + paid (unlimited)
- **Idempotency:** N/A (returns draft, doesn't create)
- **Description (draft):**
  > "Build a draft pool for a new tournament using your prior pool setup
  > as a template. Returns the draft (categories, scoring rules, deadline,
  > prior-player roster, current tournament field) for you to confirm or
  > adjust before creating. If you don't specify a prior pool, uses your
  > most recent completed pool. Use when the commissioner says 'set up a
  > pool like last year', 'run the same setup for [tournament]', or 'do
  > the [tournament] pool with the usual crew'."
- **Schema:**
  - input: `{ new_tournament_id: string, prior_pool_id?: string }`
    (commissioner_id derived from auth context server-side)
  - output: `{ draft_pool: PoolConfig, prior_players[], suggested_field[] }`
- **Wraps:** new endpoint `POST /api/mcp/internal/draft-from-prior`

### 3. `add_players` — Scoped Write
- **Auth:** Authenticated commissioner only, must be organizer of pool
- **Tier:** Free + paid (free capped at pool size limit)
- **Idempotency:** Idempotency-key required. Server normalizes payload
  (sorts `emails` list lowercased) before equality comparison.
  Same key + normalized-equal payload returns prior result; same key +
  different payload returns 409. Cache TTL: 24h.
- **Dedupe rule:** Emails deduped case-insensitively. If a pool member
  already exists with the same email, they are added to
  `skipped_duplicates`, not re-invited.
- **Batch size:** Max 25 emails per call (CC may adjust if there's a
  technical reason; surface via Product handoff if so).
- **Description (draft):**
  > "Invite one or more players to an existing Tilt pool by email.
  > Sends invite emails. Players already in the pool (by email) are
  > skipped — no duplicate invites. Players choose their own display
  > name when they accept the invite, so you only need email here. Use
  > when the commissioner says 'add [email] to the pool', 'invite
  > [contact]', or 'send an invite to [name]' (in which case extract
  > the email from prior context). Generate a stable idempotency_key
  > from the user's request so retries don't re-send invites."
- **Schema:**
  - input: `{ pool_id: string, emails: string[], idempotency_key: string }`
  - output: `{ added[], skipped_duplicates[], invites_sent: number }`
- **Wraps:** existing `POST /api/pools/[id]/invites/send` (accepts
  `emails: string[]`; player names are captured at join time, not at
  invite time)

### 4. `nudge_late_pickers` — Write with Side Effects
- **Auth:** Authenticated commissioner only, must be organizer of pool
- **Tier:** Free + paid
- **Idempotency:** Idempotency-key required. Cache TTL = rate-limit
  window (4h) — same key + same payload within 4h returns cached result.
- **Rate limit:** 1 nudge / 4h per pool, enforced before idempotency check.
  When rate-limited, error message returns commissioner-readable text:
  *"Last nudge sent at [time] — to send another, wait until [time + 4h]
  or use add_players to invite someone new."*
- **Description (draft):**
  > "Send a reminder email to all players in a Tilt pool who haven't
  > submitted picks yet. Returns the list of nudged players. Use when the
  > commissioner says 'nudge stragglers', 'remind anyone who hasn't picked',
  > or 'send a reminder'. To preview who would be nudged WITHOUT sending,
  > use the late_pickers tool first. Generate a stable idempotency_key
  > from the user's request so retries don't double-send."
- **Schema:**
  - input: `{ pool_id: string, idempotency_key: string }`
  - output: `{ nudged: [{name, email}], skipped_recently_nudged: [] }`
- **Wraps:** **NEW primitive at `POST /api/mcp/internal/nudge`.** No
  server-side pick-reminder exists today (the only "reminder" code is
  the client-side payment-reminder modal, which is unrelated). CC builds
  the primitive inside the `/api/mcp/internal/` tree to keep it
  self-contained. Required:
  1. Query members where `entriesSubmitted: 0` for the pool
  2. Send Resend email to each (new template — see below)
  3. Record nudge timestamp on the pool for rate-limit enforcement
- **New Resend template needed:** "haven't picked yet" reminder. Distinct
  from existing payment-reminder copy. Outreach Agent owns the final
  copy; CC scaffolds the template with placeholder copy that Outreach
  revises before launch. **This template addition is the ONLY exception
  to the "Resend templates" entry on the Files NOT to touch list — flag
  in the PR description.**

### 5. `late_pickers` — Read Companion
- **Auth:** Authenticated commissioner only, must be organizer of pool
- **Tier:** Free + paid
- **Idempotency:** N/A (read)
- **Description (draft):**
  > "List players in a Tilt pool who haven't submitted picks yet.
  > Read-only — does not send any notifications. Use to preview who would
  > be nudged before calling nudge_late_pickers, or when the commissioner
  > asks 'who still needs to pick'."
- **Schema:**
  - input: `{ pool_id: string }`
  - output: `{ late_pickers: [{name, email, last_seen}], total_pending: number }`
- **Wraps:** existing `GET /api/pools/[id]/members`, filtered server-side
  to `entriesSubmitted: 0`. The `last_seen` field comes from the
  member record if available; null otherwise.

### 6. `market_coverage` — Public Read / Funnel Signal
- **Auth:** Public, no auth required
- **Tier:** Free
- **Idempotency:** N/A (read)
- **Description (draft):**
  > "List the PGA Tour tournaments Tilt currently supports for live scoring.
  > Returns each tournament with a single status: 'ready' (live and
  > scoring), 'field_pending' (field not loaded yet), 'scoring_pending'
  > (scoring engine not configured), or 'unsupported'. Use when a
  > prospective commissioner asks 'do you support [tournament]' or 'is
  > [tournament] live yet'."
- **Schema:**
  - input: `{}`
  - output: `{ tournaments: [{id, name, dates, status: "ready" | "field_pending" | "scoring_pending" | "unsupported"}] }`
- **Wraps:** new public endpoint `GET /api/mcp/public/coverage`

## Composition examples

The v1 thesis is that tools compose. These chains illustrate the intended
agent behavior. CC: build for these chains, not isolated tool calls.

**Chain A — Set up a new pool from prior:**
1. Commissioner: *"set up the RBC Heritage pool, same as Masters"*
2. Agent calls `replay_last_season` → returns draft + prior players
3. Commissioner confirms in chat
4. Agent calls `add_players` with returned roster → invites sent
5. Confirms back to commissioner

**Chain B — Mid-tournament status + targeted action:**
1. Commissioner: *"how's the pool, and nudge anyone who hasn't picked"*
2. Agent calls `current_standings` → renders standings inline
3. Agent calls `late_pickers` → lists pending
4. Agent confirms with commissioner before nudging
5. Agent calls `nudge_late_pickers` → emails sent

**Chain C — Prospect funnel (public, pre-install):**
1. Curious user (no install): *"does Tilt support the Open Championship?"*
2. Agent (no auth) calls `market_coverage`
3. Returns status — agent surfaces install URL `playtilt.io/mcp` if status is `ready`

## Auth model

**Personal Access Token (PAT) bridge.** Replaces the original Clerk
OAuth Applications plan (Clerk's tenant doesn't support that feature on
its current plan; pivoting to PATs is simpler and avoids the plan
upgrade).

### Token lifecycle

1. **Generation.** Commissioner logs into `playtilt.io`, navigates to
   Settings → API tokens, clicks "Generate new token", optionally names
   it (e.g. *"Claude Desktop"*, *"work laptop"*). Server generates a
   high-entropy random string (32+ bytes, urlsafe-base64-encoded, with
   a `tilt_pat_` prefix for grep-ability), stores its hash (bcrypt or
   argon2) in `MCPToken`, returns the plaintext to the UI **once**.
2. **Display once.** The plaintext PAT is shown to the commissioner with
   a "Copy" button and a clear warning: *"Save this now — you won't be
   able to view it again. If you lose it, revoke and generate a new one."*
3. **Install.** Commissioner pastes the PAT into Claude Desktop (or
   ChatGPT, Cursor) MCP config. The agent host stores it as the Bearer
   token for `playtilt.io/api/mcp/*` calls.
4. **Use.** Every MCP request includes `Authorization: Bearer <pat>`.
   Server hashes the presented token, looks up against `MCPToken`,
   verifies it's not revoked, updates `lastUsedAt`, resolves to the
   commissioner's `userId`, attaches to request context.
5. **Revocation.** Commissioner returns to Settings → API tokens,
   clicks Revoke. Server sets `revokedAt`. Future requests with that
   PAT return 401.

### Properties

- **Tier-coupling:** PAT holds a reference to commissioner `userId`;
  tier is checked on every tool call (live). Upgrades flip immediately.
  No tier snapshot in the token.
- **Pool authorization scope (v1):** unchanged. All tools require
  organizer role on the pool referenced — strictly commissioner-side.
- **Per-tool tier gates** enforced server-side, not client-side.
- **Multiple PATs per commissioner allowed** — natural pattern when a
  commissioner uses Tilt from multiple agent hosts (Claude Desktop +
  ChatGPT, work laptop + personal). Each PAT independently revocable.
- **No expiration in v1.** PATs live until revoked. Revisit post-PGA
  if signal data warrants.
- **Rate limits per tool per commissioner** (configured in `auth.ts`):
  - `current_standings`: 60/min
  - `replay_last_season`: 5/min
  - `add_players`: 10/min
  - `nudge_late_pickers`: 1/4h per pool
  - `late_pickers`: 60/min
  - `market_coverage`: per-caller-fingerprint (User-Agent based), generous
    global cap of 1000/min — NOT per-IP, because MCP hosts (Claude Desktop,
    ChatGPT, Cursor) share egress IPs across all their users

### Why this is OK for v1

The PAT pattern is well-understood by users (GitHub, Anthropic API,
OpenAI API all use it). Install UX is one extra step compared to OAuth
(generate token in settings → paste in Claude Desktop) but avoids the
brittleness of OAuth-during-install and works on Clerk's current plan.

If MCP signal post-PGA is positive AND Clerk OAuth Applications becomes
desirable, migration is clean: add OAuth as an *additional* install
method, existing PAT users keep working unchanged.

## Idempotency model (write tools)

- `idempotency_key` parameter required on `add_players` and `nudge_late_pickers`
- Server stores `(commissioner_id, tool_name, idempotency_key) → result`
- **Payload comparison:** strict JSON equality after server-side normalization
  (sort `players[]` by lowercased email for `add_players`; no normalization
  needed for `nudge_late_pickers` since payload is just `pool_id`)
- Cache TTL per tool:
  - `add_players`: 24h
  - `nudge_late_pickers`: 4h (matches rate-limit window — both systems
    express the same time horizon)
- Same key + normalized-equal payload within TTL = return cached result (200)
- Same key + different payload = 409 Conflict (key reuse)
- Missing key on a write tool = 400 Bad Request

## Distribution plan

**Day 5 (May 11):**
- Smithery.ai submission with description + screenshots (3 listings: server
  + 2 example use cases)
- Anthropic MCP directory submission
- Cursor registry submission
- `playtilt.io` footer line: *"Use Tilt from your AI assistant —
  playtilt.io/mcp"* (placeholder copy locked here; Outreach Agent may
  revise via handoff before launch)
- Cold-email signature line: handed to Outreach Agent via separate handoff

**Day 6 (May 12):**
- **c/ai dogfood install** (locked 2026-05-06): Tilt Strategy + Tilt
  Product + Tilt Outreach c/ai projects install `playtilt.io/mcp` as a
  connector. Moved earlier than Day 7 to provide 24h buffer for surfacing
  install-flow friction before public launch.
- Top 3 friction fixes from c/ai install + standalone agent dogfood
  (combined into single friction pass)

**Day 7 (May 13):**
- Soft public install link live
- Final smoke + log instrumentation verification

**Registry acceptance vs. launch rule:** Day 7 launch proceeds with
whatever registries have accepted by then. Install URL `playtilt.io/mcp`
works regardless of registry status; registries are amplification, not
blocking.

**Out of scope for v1:** Beeper/iMessage MCP, ChatGPT plugins (separate
flow), Perplexity, custom registries.

## Signal instrumentation

Every tool call records:
- Timestamp (UTC)
- Tool name
- Caller fingerprint (User-Agent → Claude Desktop / ChatGPT / Cursor / Other)
- Commissioner ID (anonymized hash for non-Jeff calls)
- Input payload (PII-stripped — see rule below)
- Output success/failure
- Latency (ms)
- Tier (free / paid / public)

**PII strip rule:**
- Strip: `email`, `emails[*]`, `name`
- Keep: `pool_id`, `tournament_id`, `idempotency_key`, counts, status
  fields, error codes

**Storage mechanism:** CC's choice (DB table, structured stdout logs to
existing infra, etc.). Requirement: must be possible to answer queries
like *"how many tool calls in the last 7 days, grouped by caller
fingerprint and tool name"* without reading a markdown file.

**Weekly summary artifact:** Product Agent posts a weekly Monday-morning
handoff to `ops/handoffs/inbox/` summarizing the prior 7 days from the
underlying log. The summary is a Product-derived artifact, not the log
itself.

## Acceptance criteria

### Build acceptance (Day 7)
- [ ] All 6 tools live and callable from Claude Desktop with installed plugin
- [ ] Auth: PAT validation works — request with valid Bearer PAT resolves
      to commissioner; revoked or absent PAT returns 401 with helpful hint
- [ ] Settings UI at `/settings/api-tokens` lets commissioner generate,
      view metadata, and revoke PATs. Plaintext PAT shown exactly once
      on generation, never retrievable again
- [ ] `MCPToken` schema deployed; existing tables unchanged
- [ ] Auth bridge: commissioner sees their pools, can't see other commissioners'
- [ ] Tier gating: free-tier commissioner blocked from creating 2nd pool
- [ ] Tier-token coupling live: free→paid upgrade reflected on next tool call
- [ ] Idempotency: same key + normalized-equal payload returns same result, no
      duplicate invite emails sent
- [ ] Rate limits enforced (manual smoke test); commissioner-readable error
      message on `nudge_late_pickers` rate-limit hit
- [ ] Server log instrumentation writes structured records on every call;
      queryability check (manual: query "calls in last 24h grouped by
      tool" via whatever mechanism CC chose)
- [ ] PII strip rule applied: log records contain pool_ids, never emails
- [ ] All 3 registries submitted (acceptance not blocking)
- [ ] Install URL `playtilt.io/mcp` resolves and serves discovery metadata
      (open question — see Strategy handoff)
- [ ] c/ai dogfood install successful on Day 6 across all 3 c/ai projects
- [ ] Jeff successfully runs his PGA pool creation entirely through Claude
      Desktop (zero playtilt.io visits during setup)

### Signal acceptance (8 weeks post-PGA, ~July 9)
The launch is a falsifiable success if **either** of:
- [ ] ≥3 distinct non-Jeff commissioner IDs recorded, each with ≥5 tool calls
- [ ] ≥1 non-Jeff commissioner that called write tools (`add_players` or
      `nudge_late_pickers`) — write-tool calls indicate real use, not curiosity

Plus:
- [ ] Tool roadmap reviewed at week 4 with v1.1 candidate list (demand-driven)
- [ ] Build lessons captured in `ops/canonical/BUILD-LESSONS.md` via handoff
- [ ] Portable template `mcp-server-template` written, ready for DS MCP build

## Flow trace checks (FT-)

- **FT-001** Install flow: Jeff visits `playtilt.io/mcp`, follows
  install instructions: (a) logs into Tilt, (b) navigates to Settings →
  API tokens, (c) generates a new PAT, (d) copies it, (e) pastes it
  into Claude Desktop's MCP server config (with the `playtilt.io/api/mcp`
  URL). Claude Desktop reconnects → tools appear in Claude tool palette
  → first `tools/list` call to MCP returns the 6-tool catalog
- **FT-002** Pool creation via agent (Chain A): Jeff says *"set up the RBC
  Heritage pool, same as Masters"* → Claude calls `replay_last_season` →
  returns draft → Jeff confirms → Claude calls `add_players` → invites sent
- **FT-003** Mid-round check: Jeff says *"where's the pool"* → Claude calls
  `current_standings` → returns markdown table inline
- **FT-004** Nudge flow (Chain B): Jeff says *"anyone still need to pick"*
  → Claude calls `late_pickers` (read) → returns list → Jeff confirms →
  Claude calls `nudge_late_pickers` → emails sent
- **FT-005** Cross-tool composition: Jeff says *"check standings, format for
  iMessage"* → Claude calls `current_standings` → reformats output as plain
  text block
- **FT-006** Public funnel (Chain C): a curious agent (no auth) calls
  `market_coverage` → receives tournament list → install URL surfaces in
  agent host UI

## State matrix checks (SM-)

- **SM-001** Free tier commissioner with 1 active pool calls `replay_last_season`
  → blocked with clear error message naming the tier limit
- **SM-002** Public caller (no auth) calls `current_standings` → 401
  Unauthorized with link to install
- **SM-003** Public caller calls `market_coverage` → 200 OK with full list
- **SM-004** Authenticated commissioner calls a tool on a pool they don't
  organize (any tool, including reads) → 403 Forbidden
- **SM-005** Free-tier commissioner upgrades to paid mid-session → next
  tool call reflects paid tier without re-install
- **SM-006** `nudge_late_pickers` called within 4h of last successful nudge
  on same pool → 429 with commissioner-readable error message
- **SM-007** `add_players` called with batch of 26 emails → 400 with
  message naming the limit
- **SM-008** Request to `/api/mcp/*` with no `Authorization` header → 401
  with commissioner-readable hint: *"Generate a token at
  playtilt.io/settings/api-tokens and paste it into your MCP client config."*
- **SM-009** Request to `/api/mcp/*` with `Authorization: Bearer <revoked-pat>`
  → 401 with hint: *"This token has been revoked. Generate a new one at
  playtilt.io/settings/api-tokens."*
- **SM-010** Generating a PAT in the settings UI returns the plaintext
  token exactly once; subsequent visits to the settings page show only
  metadata (name, lastUsedAt, createdAt) — never the plaintext

_Removed in v0.5: prior SM-005 (`share_token` paths) — share-token
support deferred to v1.1, no public-link auth in v1._

_Added in v0.6: SM-008..010 (PAT auth state checks)._

## Regression checks (REG-)

- **REG-001** All existing playtilt.io flows work unchanged (manual smoke
  via Day 6 dogfood session)
- **REG-002** Existing scoring engine outputs identical results before and
  after MCP server deploy
- **REG-003** Existing payment-reminder modal (Venmo/Zelle copy-to-
  clipboard helper) continues to function unchanged. The new pick-
  reminder Resend template is separate and additive. (Note: there is
  no existing pick-reminder code to regress against — REG-003 in v0.4
  referenced a primitive that doesn't exist.)
- **REG-004** Clerk auth flows on web unchanged
- **REG-005** No changes to player-facing pick flow (`/p/[id]/picks` or
  equivalent — CC: confirm exact path during Day 1 mapping)

## Sprint timeline (working backwards from PGA)

| Day | Date | Work | Status |
|---|---|---|---|
| 0 | May 6 | Spec lock (v0.1→v0.5 walkthrough revisions) | ✅ |
| 1 | May 7 | CC reality audit, spec corrections to v0.5, branch triage | ✅ |
| 2 | May 8 | Read tools built (`current_standings`, `late_pickers`, `market_coverage`); JSON-RPC dispatch; auth stub with dev-bypass; logging; middleware bypass; v0.6 spec pivot to PAT auth | ✅ (build), 🔄 (spec patch this session) |
| 3 | May 9 | Local install + dogfood with Masters 2026 data using dev-bypass token. **Build PAT generation API + settings UI alongside** (was Day 4 work; pulled forward to derisk Day 4). | upcoming |
| 4 | May 10 | Auth bridge real (PAT validation in MCP route); write tools (`add_players`, greenfield `nudge_late_pickers` + new Resend template). **Dedicated tool-description polish session** (Jeff writes; one block, not interleaved). | upcoming |
| 5 | May 11 | Distribution: 3 registries + footer line + landing page (with PAT install instructions). (Outreach handoff for cold-email sig handled in parallel.) | upcoming |
| 6 | May 12 | c/ai dogfood install. End-to-end PGA pool creation through agent. Top 3 friction fixes (combined pass). | upcoming |
| 7 | May 13 | Final smoke. Log instrumentation verified. Public install live. | upcoming |
| 8 | May 14 | PGA Round 1. MCP live. Watch logs. Ship nothing new. | — |

**Slip plan:** if Day 4 runs over, drop `nudge_late_pickers` to v1.1
(keep `late_pickers` read-only as the agent companion). Three read tools
+ `replay_last_season` + `add_players` is still a viable v1. The PAT
auth pivot (v0.6) reduces Day 4 risk relative to the original Clerk OAuth
plan — the auth bridge is now ~30 lines of Bearer-token validation
instead of an OAuth flow integration — but the schema change for
`MCPToken` and the settings UI are net new work. Net Day 4 estimated
similar to v0.5 plan.

## Open questions

_None at v0.2 lock. Surface new questions via Product handoff during build._

## Tool roadmap pointer

This spec covers v1.0. Tool surface evolution (v1.1+) tracked at
`ops/canonical/tool-roadmap.md`. Additions follow the demand-driven
discipline described there. Do not add tools to this spec post-Day-1
lock — propose them via Product handoff for the roadmap.

## Locked decisions (resolved 2026-05-06)

1. **Install URL:** `playtilt.io/mcp` — same Vercel project, no DNS work.
2. **Tool description polish:** Dedicated Day 4 session, one block of work,
   not interleaved with build. Jeff writes (commissioner-language is the
   ex-operator edge that doesn't delegate cleanly).
3. **c/ai dogfood:** Day 6 install of `playtilt.io/mcp` connector on
   Tilt Strategy + Tilt Product + Tilt Outreach c/ai projects.
4. **Endpoint locations:** All new endpoints under `/api/mcp/`. Public
   endpoints live at `/api/mcp/public/*` — public refers to auth, not
   URL location.
5. **Pool authorization scope (v1):** Strictly commissioner-side. All tools
   require organizer role. No player-side reads via MCP.
6. **Registry acceptance rule:** Day 7 launch proceeds regardless of
   registry-acceptance status. Install URL works independent of registries.
7. **`playtilt.io/mcp` serves a landing page.** Human-readable install
   instructions for Claude Desktop, ChatGPT, Cursor (and future agent
   hosts). The page links to `.well-known/mcp.json` for registries that
   want raw metadata. Build cost: ~half a day, lands during Day 5
   distribution work. The MCP server itself runs at
   `/api/mcp/[[...slug]]`; the landing page is a separate marketing page
   at `/mcp`.
8. **Build repo: `edge-pools`, not `tilt-v2`.** The v1 web app
   (Next.js + Prisma + Clerk + scoring engine) lives in
   `github.com/jmill823/edge-pools` and is deployed at
   `edge-pools.vercel.app`. `tilt-v2` is a fresh monorepo skeleton with
   the orchestrator framework but no code. Building MCP in `edge-pools`
   avoids a 3-5+ day port and preserves the PGA forcing function. The
   eventual port to a `tilt-v2` monorepo (whenever the rename happens)
   is bounded mechanical work — ~1-2 days of path updates and import
   reconfiguration. The MCP contract (tool names, schemas, descriptions,
   registry submissions) is portable and survives the move unchanged.
9. **Spec + handoffs live in `edge-pools/ops/`.** The orchestrator
   framework's documents (specs, handoffs, canonical) sit alongside the
   code for this sprint. When the eventual move to `tilt-v2` happens,
   `git mv ops/` ports the framework with minor path updates. CC works
   in one repo only.
10. **Repo governance:** This sprint follows `edge-pools/CLAUDE.md`'s
    Gate A → Gate B → Gate C flow. CC writes a Gate A scope note before
    scaffolding, runs Gate B preview verification before deploying, and
    runs Gate C production smoke before Day 7 launch. The spec's
    FT/SM/REG checks slot into Gate C's auto-verify pass.
11. **`add_players` schema is `emails: string[]`,** not
    `players: [{name, email}]`. The existing `POST /api/pools/[id]/invites/send`
    endpoint accepts emails only; player display names are captured at
    join time, not invite time. This is correct UX and the MCP schema
    matches.
12. **`share_token` deferred to v1.1.** No `share_token` primitive exists
    on pools today; adding one requires a schema change that's out of
    scope. `current_standings` is commissioner-only in v1.
13. **`movement[]` deferred to v1.1.** Computing "change since last
    check" requires storing point-in-time leaderboard snapshots that
    don't exist today. v1 returns current standings only.
14. **`nudge_late_pickers` requires building the primitive,** not
    wrapping existing code. No server-side pick-reminder exists in
    `edge-pools` today (the only "reminder" code is a client-side
    payment-reminder modal, unrelated). CC builds the primitive at
    `POST /api/mcp/internal/nudge` and adds one new Resend template
    for "haven't picked yet" reminders. This is the only exception to
    the "Resend templates" item on the Files NOT to touch list.
15. **Auth model: Personal Access Tokens (PATs), not Clerk OAuth
    Applications.** Clerk's tenant doesn't support OAuth Applications
    on its current plan. Pivoting to PATs avoids the plan upgrade and
    is simpler for v1. Commissioners generate a PAT in their account
    settings, paste it into Claude Desktop's MCP config. Stored as
    `MCPToken` model in Prisma (one new model — only schema change in
    v1). The PAT pattern is standard (GitHub, Anthropic API, OpenAI API
    use it) and well-understood by users. Clerk OAuth Applications can
    be added as an *additional* install method post-PGA if signal data
    warrants the plan upgrade — existing PAT users keep working unchanged.
16. **`prisma/schema.prisma` scoped exception.** v0.6 allows ONE schema
    addition: the `MCPToken` model. No fields added to existing tables;
    no modifications to existing models. Any further schema needs go
    via Product handoff.

## Changelog

| Date | Revision | Changes |
|---|---|---|
| 2026-05-06 | v0.1 | Initial spec. |
| 2026-05-06 | v0.2 | Walkthrough revisions. Goal sentence tightened. Day 0 prerequisites added (API-blocking branches + Clerk Apps confirmation). Endpoint locations locked under `/api/mcp/`. `replay_last_season` schema fixed (commissioner_id derived from auth, not input). `market_coverage` status fields collapsed to single enum. `add_players` dedupe rule + max batch size + idempotency normalization specified. `nudge_late_pickers` rate-limit error message specified. `current_standings` `share_token` field added for public-link auth. `market_coverage` rate limit moved from per-IP to per-caller-fingerprint with global cap. Tier-token coupling locked as live-reference. Pool authorization scope locked as commissioner-only. Idempotency cache TTL = rate-limit window per tool. PII strip rule specified. Log storage mechanism delegated to CC with queryability requirement. Signal acceptance bar tightened (≥3 commissioners with ≥5 calls OR ≥1 write-tool caller). c/ai dogfood install moved Day 7→Day 6. Registry acceptance rule explicit. Composition examples section added. SM-005 through SM-008 added. FT-006 added. Cold-email sig line moved out of spec to Outreach handoff. `/mcp` serving question routed to Strategy. |
| 2026-05-06 | v0.3 | `/mcp` URL serving choice locked: landing page (option a). New file `apps/web/app/mcp/page.tsx` added to files-to-touch. Strategy handoff for `/mcp` choice rescinded (Jeff decided directly). |
| 2026-05-06 | v0.4 | **Repo correction.** CC validated against `tilt-v2` repo and found `apps/web/` empty — the v1 web app actually lives in `github.com/jmill823/edge-pools` (flat Next.js, deployed at edge-pools.vercel.app). All `apps/web/...` paths rewritten to `src/...` for the flat layout. CC instructed to verify exact `src/` structure on Day 1 before scaffolding. Day 0 prerequisites reframed as CC's first-day actions (existing-API mapping + branch triage + Clerk validation) rather than Jeff prerequisites. New locked decisions #8 (build repo = edge-pools) and #9 (ops folder lives in edge-pools for this sprint). The eventual port to a tilt-v2 monorepo is bounded ~1-2 days of mechanical work; MCP contract survives unchanged. |
| 2026-05-06 | v0.5 | **API-surface reality audit.** CC mapped the actual `edge-pools` API surface on Day 1 and reported five defects in v0.4. All resolved here. (1) `current_standings` wraps `/api/pools/[id]/leaderboard` not `/standings`; output reshaped from upstream `{pool, tournament, templateName, onCourse, pendingReplacements, entries[], rosterRuleSummary}` to agent-facing `{tournament_status, players[]}`. (2) `add_players` schema dropped `name` field (existing endpoint is `POST /api/pools/[id]/invites/send`, accepts `emails: string[]` only — names captured at join time). (3) `share_token` deferred to v1.1; no primitive exists. SM-005 removed. `current_standings` becomes commissioner-only. (4) `movement[]` deferred to v1.1; requires snapshot storage that doesn't exist. (5) `nudge_late_pickers` is now greenfield, not a wrapper — building primitive at `POST /api/mcp/internal/nudge` plus one new Resend template ("haven't picked yet"). REG-003 rewritten (no existing pick-reminder to regress). New file `src/middleware.ts` added to files-to-touch (MCP routes need to bypass Clerk middleware). Locked decisions #10–#14 added. Branch triage clean (CC verified). Clerk Apps validation routed to Jeff dashboard check. Repo governance (CLAUDE.md Gate A/B/C flow) acknowledged. **Lesson captured: future specs must verify against actual repo before locking, not after CC blocks.** |
| 2026-05-08 | v0.6 | **Auth model pivot to Personal Access Tokens (PATs).** Jeff confirmed 2026-05-08 that Clerk tenant is on Free tier with no OAuth Applications feature available. Pivoted to PAT-based auth: commissioners generate tokens in account settings, paste into Claude Desktop. New files-to-touch: `src/app/api/mcp-tokens/route.ts` (token CRUD), `src/app/(app)/settings/api-tokens/page.tsx` (settings UI), `prisma/schema.prisma` scoped addition of `MCPToken` model. `src/app/api/mcp/auth.ts` redefined: PAT validation (Bearer token → bcrypt verify → resolve userId) instead of OAuth bridge. FT-001 rewritten for PAT install flow. SM-008..010 added (no auth → 401, revoked PAT → 401, PAT shown plaintext exactly once). Sprint timeline updated with current Day 1+2 status; Day 3 expanded to include PAT generation API + settings UI (pulled forward to derisk Day 4). New locked decisions #15 (PAT auth) and #16 (schema scoped exception). The original Clerk OAuth path remains a viable post-PGA migration if signal warrants the plan upgrade — PAT users would not be disrupted. |
