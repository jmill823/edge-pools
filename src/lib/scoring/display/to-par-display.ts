import type { DisplayAdapter, ScoringType, ScoreColor } from "../types";

/**
 * Display adapter for to-par scoring.
 * Formats scores as -5, +3, E. Colors: green for under, red for over, muted for even.
 */
export const toParDisplay: DisplayAdapter = {
  type: "to-par" as ScoringType,

  formatRoundScore(score: number | null): string {
    if (score === null) return "-";
    if (score === 0) return "E";
    if (score > 0) return `+${score}`;
    return `${score}`;
  },

  formatTotal(score: number): string {
    if (score === 0) return "E";
    if (score > 0) return `+${score}`;
    return `${score}`;
  },

  getScoreColor(score: number | null): ScoreColor {
    if (score === null) return "neutral";
    if (score < 0) return "under";
    if (score > 0) return "over";
    return "even";
  },

  getColumnHeaders(): string[] {
    return ["POS", "ENTRY", "MC", "R1", "R2", "R3", "R4", "TOTAL"];
  },
};
