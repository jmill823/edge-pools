/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DisplayAdapter, ScoringType, ScoreColor } from "../types";

/**
 * Points display adapter — SCAFFOLD ONLY.
 * All methods throw "not yet implemented".
 */
export const pointsDisplay: DisplayAdapter = {
  type: "points" as ScoringType,

  formatRoundScore(_score: number | null): string {
    throw new Error("Points display is not yet implemented. Coming soon.");
  },

  formatTotal(_score: number): string {
    throw new Error("Points display is not yet implemented. Coming soon.");
  },

  getScoreColor(_score: number | null): ScoreColor {
    throw new Error("Points display is not yet implemented. Coming soon.");
  },

  getColumnHeaders(): string[] {
    throw new Error("Points display is not yet implemented. Coming soon.");
  },
};
