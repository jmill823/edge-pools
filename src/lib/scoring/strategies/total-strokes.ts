import type {
  ScoringStrategy,
  ScoringType,
  GolferTournamentData,
  PoolScoringConfig,
  EntryScore,
  TiebreakerRule,
} from "../types";

/**
 * Total strokes scoring strategy.
 * Golfer scores are raw stroke counts. Lower is better.
 */
export const totalStrokesStrategy: ScoringStrategy = {
  type: "total-strokes" as ScoringType,
  sortDirection: "asc",

  calculateGolferTotal(
    golfer: GolferTournamentData,
    config: PoolScoringConfig,
    allGolferData: GolferTournamentData[]
  ): number | null {
    if (golfer.rounds.length === 0) return null;

    let total = 0;
    let hasAnyScore = false;

    for (const round of golfer.rounds) {
      if (round.strokes !== null) {
        total += round.strokes;
        hasAnyScore = true;
      }
    }

    if (!hasAnyScore) return null;

    // Apply missed cut penalty
    if (golfer.status === "cut") {
      total = applyMissedCutPenalty(total, golfer, config, allGolferData);
    }

    return total;
  },

  calculateEntryTotal(golferTotals: (number | null)[]): number {
    return golferTotals.reduce((sum: number, t) => sum + (t ?? 0), 0);
  },

  assignPositions(entries: EntryScore[]): EntryScore[] {
    const sorted = [...entries].sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total;
      return a.submittedAt.getTime() - b.submittedAt.getTime();
    });

    for (let i = 0; i < sorted.length; i++) {
      let pos = i + 1;
      for (let j = 0; j < i; j++) {
        if (sorted[j].total === sorted[i].total) {
          pos = sorted[j].position;
          break;
        }
      }
      sorted[i].position = pos;

      const isTied = sorted.some(
        (e, idx) => idx !== i && e.total === sorted[i].total
      );
      sorted[i].positionDisplay = isTied ? `T${pos}` : `${pos}`;
    }

    return sorted;
  },

  resolveTiebreaker(
    tied: EntryScore[],
    tiebreakerRule: TiebreakerRule
  ): EntryScore[] {
    if (tiebreakerRule === "none") return tied;

    if (tiebreakerRule === "entry-timestamp") {
      return [...tied].sort(
        (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()
      );
    }

    if (tiebreakerRule === "best-individual") {
      return [...tied].sort((a, b) => {
        const bestA = Math.min(
          ...a.golfers
            .filter((g) => g.total !== null && !g.isExcludedByRosterRule)
            .map((g) => g.total!)
        );
        const bestB = Math.min(
          ...b.golfers
            .filter((g) => g.total !== null && !g.isExcludedByRosterRule)
            .map((g) => g.total!)
        );
        return bestA - bestB;
      });
    }

    return tied;
  },
};

function applyMissedCutPenalty(
  currentTotal: number,
  golfer: GolferTournamentData,
  config: PoolScoringConfig,
  allGolferData: GolferTournamentData[]
): number {
  const completedRounds = golfer.rounds.filter((r) => r.isComplete).length;
  const totalRounds = 4;
  const missedRounds = totalRounds - completedRounds;

  if (missedRounds <= 0) return currentTotal;

  switch (config.missedCutPenaltyType) {
    case "carry-score":
      return currentTotal;

    case "fixed-per-round":
      // For strokes mode, the penalty is raw strokes (e.g., 80 per round)
      return currentTotal + (config.missedCutFixedPenalty ?? 80) * missedRounds;

    case "worst-make-cut": {
      const madeCut = allGolferData.filter(
        (g) => g.status !== "cut" && g.status !== "withdrawn"
      );
      if (madeCut.length === 0) return currentTotal;

      const worstTotal = Math.max(
        ...madeCut
          .map((g) => g.totalStrokes)
          .filter((t): t is number => t !== null)
      );

      return Math.max(currentTotal, worstTotal);
    }

    default:
      return currentTotal;
  }
}
