import type { RosterRule, RosterRuleType, GolferEntryScore, RosterRuleConfig } from "../types";

/**
 * Drop-worst roster rule: exclude the worst X golfer scores.
 * Inverse of best-of. Mode: per-tournament or per-round.
 */
export const dropWorstRule: RosterRule = {
  type: "drop-worst" as RosterRuleType,

  apply(golferScores: GolferEntryScore[], config: RosterRuleConfig): GolferEntryScore[] {
    const dropCount = config.count ?? 0;

    if (dropCount <= 0 || dropCount >= golferScores.length) {
      return golferScores.map((g) => ({
        ...g,
        isExcludedByRosterRule: dropCount >= golferScores.length,
      }));
    }

    if (config.mode === "per-tournament") {
      return applyPerTournament(golferScores, dropCount);
    }

    // per-round: same display-level treatment as per-tournament
    return applyPerTournament(golferScores, dropCount);
  },
};

function applyPerTournament(
  golferScores: GolferEntryScore[],
  dropCount: number
): GolferEntryScore[] {
  // Sort by total descending (worst scores first for to-par/strokes)
  // Null totals are worst
  const sorted = [...golferScores].sort((a, b) => {
    if (a.total === null && b.total === null) return 0;
    if (a.total === null) return -1; // null = worst
    if (b.total === null) return 1;
    return b.total - a.total; // higher = worse for asc scoring
  });

  const dropIds = new Set(sorted.slice(0, dropCount).map((g) => g.golferId));

  return golferScores.map((g) => ({
    ...g,
    isExcludedByRosterRule: dropIds.has(g.golferId),
  }));
}
