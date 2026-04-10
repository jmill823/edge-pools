import type { DisplayAdapter, ScoringType, ScoreColor } from "../types";

/**
 * Display adapter for total strokes scoring.
 * Formats scores as plain numbers. No color coding on individual rounds.
 */
export const strokesDisplay: DisplayAdapter = {
  type: "total-strokes" as ScoringType,

  formatRoundScore(score: number | null): string {
    if (score === null) return "-";
    return `${score}`;
  },

  formatTotal(score: number): string {
    return `${score}`;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getScoreColor(_score: number | null): ScoreColor {
    return "neutral";
  },

  getColumnHeaders(): string[] {
    return ["POS", "ENTRY", "MC", "R1", "R2", "R3", "R4", "TOTAL"];
  },
};
