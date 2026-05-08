// Shared types for the TILT MCP server. v1.0 contract per
// ops/specs/pending/tilt-mcp-v1.md (v0.5).

export type Tier = "free" | "paid" | "public";

export type CallerFingerprint =
  | "Claude Desktop"
  | "ChatGPT"
  | "Cursor"
  | "Other";

export interface AuthContext {
  commissionerId: string;
  tier: Tier;
}

export interface PublicCallerContext {
  fingerprint: CallerFingerprint;
}

export type ToolCallContext = AuthContext | PublicCallerContext;

export interface ToolCallLogRecord {
  ts: string;
  tool: string;
  fingerprint: CallerFingerprint;
  commissioner_id_hash: string | null;
  input: unknown;
  ok: boolean;
  error_code: string | null;
  latency_ms: number;
  tier: Tier;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

// current_standings output shape
export interface StandingsPlayer {
  rank: number | null;
  rank_display: string;
  team_name: string;
  total_points: number | null;
  total_display: string;
  picks_by_category: Record<string, StandingsPick>;
}

export interface StandingsPick {
  golfer_name: string;
  country: string | null;
  status: "active" | "cut" | "withdrawn" | "complete";
  score_to_par: number | null;
  score_display: string;
  is_replacement: boolean;
}

export interface CurrentStandingsOutput {
  pool_name: string;
  tournament_name: string;
  tournament_status:
    | "upcoming"
    | "live"
    | "between_rounds"
    | "complete"
    | "archived";
  current_round: number | null;
  on_course: number;
  players: StandingsPlayer[];
}

// late_pickers output shape.
// `joined_at` returns the PoolMember.joinedAt timestamp. Spec § Tool Surface
// #5 originally called this `last_seen`, but the underlying model has no
// last-activity column — we surface joinedAt as the most useful signal.
// Field renamed in v0.6 patch (Day 2 watch-item) so the agent doesn't
// misrepresent the value to commissioners.
export interface LatePicker {
  name: string;
  email: string;
  joined_at: string | null;
}

export interface LatePickersOutput {
  late_pickers: LatePicker[];
  total_pending: number;
}

// market_coverage output shape
export type CoverageStatus =
  | "ready"
  | "field_pending"
  | "scoring_pending"
  | "unsupported";

export interface CoverageEntry {
  id: string;
  name: string;
  dates: { start: string; end: string };
  status: CoverageStatus;
}

export interface MarketCoverageOutput {
  tournaments: CoverageEntry[];
}
