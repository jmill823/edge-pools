// ============================================================
// Scoring Engine — Shared Types & Interfaces
// ============================================================

// --- Scoring types (extensible) ---

export type ScoringType = "to-par" | "total-strokes" | "points";

export type RosterRuleType = "all-play" | "best-of" | "drop-worst";

export type RosterRuleMode = "per-tournament" | "per-round";

export type TiebreakerRule = "entry-timestamp" | "best-individual" | "none";

export type MissedCutPenalty = "carry-score" | "fixed-per-round" | "worst-make-cut";

// --- Commissioner config (stored on pool record) ---

export interface PoolScoringConfig {
  scoringType: ScoringType;
  missedCutPenaltyType: MissedCutPenalty;
  missedCutFixedPenalty: number;
  tiebreakerRule: TiebreakerRule;
  rosterRule: RosterRuleType;
  rosterRuleMode: RosterRuleMode;
  rosterRuleCount: number | null;
}

// --- Data input types ---

export interface GolferRoundData {
  round: number;
  strokes: number | null;
  scoreToPar: number | null;
  holesCompleted: number;
  isComplete: boolean;
}

export interface GolferTournamentData {
  golferId: string;
  name: string;
  country: string | null;
  position: string | null; // "1", "T5", "CUT", "WD"
  status: "active" | "cut" | "withdrawn" | "complete";
  thru: number | null; // holes completed in current round, null if not on course
  currentRound: number | null;
  rounds: GolferRoundData[];
  totalToPar: number | null;
  totalStrokes: number | null;
}

export interface EntryData {
  entryId: string;
  teamName: string;
  userId: string | null;
  submittedAt: Date;
  golfers: EntryGolferData[];
}

export interface EntryGolferData {
  golferId: string;
  golferName: string;
  golferCountry: string | null;
  categoryId: string;
  categoryName: string;
  categoryAbbrev: string;
  categorySortOrder: number;
  isReplacement: boolean;
  originalGolferName: string | null;
}

// --- Scoring output types ---

export interface GolferEntryScore {
  golferId: string;
  golferName: string;
  golferCountry: string | null;
  categoryName: string;
  categoryAbbrev: string;
  categorySortOrder: number;
  position: string | null;
  positionDisplay: string;
  status: "active" | "cut" | "withdrawn" | "complete";
  thru: number | null;
  thruDisplay: string;
  roundScores: RoundScoreDisplay[];
  total: number | null;
  totalDisplay: string;
  totalColor: ScoreColor;
  isExcludedByRosterRule: boolean;
  isReplacement: boolean;
  originalGolferName: string | null;
}

export interface RoundScoreDisplay {
  round: number;
  score: number | null;
  display: string;
  color: ScoreColor;
}

export interface EntryScore {
  entryId: string;
  teamName: string;
  userId: string | null;
  submittedAt: Date;
  position: number;
  positionDisplay: string;
  total: number;
  totalDisplay: string;
  totalColor: ScoreColor;
  roundScores: RoundScoreDisplay[];
  activePicks: number;
  totalPicks: number;
  isCurrentUser: boolean;
  golfers: GolferEntryScore[];
}

export type ScoreColor = "under" | "over" | "even" | "neutral";

// --- Strategy interface ---

export interface ScoringStrategy {
  type: ScoringType;
  sortDirection: "asc" | "desc";

  calculateGolferTotal(
    golfer: GolferTournamentData,
    config: PoolScoringConfig,
    allGolferData: GolferTournamentData[]
  ): number | null;

  calculateEntryTotal(golferTotals: (number | null)[]): number;

  assignPositions(entries: EntryScore[]): EntryScore[];

  resolveTiebreaker(
    tied: EntryScore[],
    tiebreakerRule: TiebreakerRule
  ): EntryScore[];
}

// --- Roster rule interface ---

export interface RosterRuleConfig {
  type: RosterRuleType;
  mode: RosterRuleMode;
  count: number | null;
}

export interface RosterRule {
  type: RosterRuleType;

  apply(
    golferScores: GolferEntryScore[],
    config: RosterRuleConfig
  ): GolferEntryScore[];
}

// --- Display adapter interface ---

export interface DisplayAdapter {
  type: ScoringType;

  formatRoundScore(score: number | null): string;
  formatTotal(score: number): string;
  getScoreColor(score: number | null): ScoreColor;
  getColumnHeaders(): string[];
}

// --- Leaderboard API response ---

export interface LeaderboardResponse {
  pool: {
    id: string;
    name: string;
    tournament: string;
    template: string;
    status: string;
    scoringConfig: PoolScoringConfig;
  };
  entries: EntryScore[];
  rosterRuleSummary: string | null;
}
