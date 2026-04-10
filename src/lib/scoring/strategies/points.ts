/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ScoringStrategy,
  ScoringType,
  GolferTournamentData,
  PoolScoringConfig,
  EntryScore,
  TiebreakerRule,
} from "../types";

/**
 * Points-based scoring strategy — SCAFFOLD ONLY.
 * All methods throw "not yet implemented".
 */
export const pointsStrategy: ScoringStrategy = {
  type: "points" as ScoringType,
  sortDirection: "desc",

  calculateGolferTotal(
    _golfer: GolferTournamentData,
    _config: PoolScoringConfig,
    _allGolferData: GolferTournamentData[]
  ): number | null {
    throw new Error("Points scoring is not yet implemented. Coming soon.");
  },

  calculateEntryTotal(_golferTotals: (number | null)[]): number {
    throw new Error("Points scoring is not yet implemented. Coming soon.");
  },

  assignPositions(_entries: EntryScore[]): EntryScore[] {
    throw new Error("Points scoring is not yet implemented. Coming soon.");
  },

  resolveTiebreaker(
    _tied: EntryScore[],
    _tiebreakerRule: TiebreakerRule
  ): EntryScore[] {
    throw new Error("Points scoring is not yet implemented. Coming soon.");
  },
};
