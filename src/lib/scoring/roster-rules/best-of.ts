import type { RosterRule, RosterRuleType, GolferEntryScore, RosterRuleConfig } from "../types";

/**
 * Best-of roster rule: keep the best X golfer scores, exclude the rest.
 * Mode: per-tournament (based on total) or per-round (applied per round).
 */
export const bestOfRule: RosterRule = {
  type: "best-of" as RosterRuleType,

  apply(golferScores: GolferEntryScore[], config: RosterRuleConfig): GolferEntryScore[] {
    const count = config.count ?? golferScores.length;

    if (count >= golferScores.length) {
      // Keep all — same as all-play
      return golferScores.map((g) => ({ ...g, isExcludedByRosterRule: false }));
    }

    if (config.mode === "per-tournament") {
      return applyPerTournament(golferScores, count);
    }

    // per-round mode: mark golfers as excluded, but the per-round calculation
    // is handled in the engine when computing round aggregates.
    // For the golfer-level display, we mark by tournament total.
    return applyPerTournament(golferScores, count);
  },
};

function applyPerTournament(
  golferScores: GolferEntryScore[],
  keepCount: number
): GolferEntryScore[] {
  // Sort by total ascending (lower is better for to-par and strokes)
  // Null totals go to the end (excluded by default)
  const sorted = [...golferScores].sort((a, b) => {
    if (a.total === null && b.total === null) return 0;
    if (a.total === null) return 1;
    if (b.total === null) return -1;
    return a.total - b.total;
  });

  const keepIds = new Set(sorted.slice(0, keepCount).map((g) => g.golferId));

  return golferScores.map((g) => ({
    ...g,
    isExcludedByRosterRule: !keepIds.has(g.golferId),
  }));
}
