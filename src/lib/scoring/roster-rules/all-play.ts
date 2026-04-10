import type { RosterRule, RosterRuleType, GolferEntryScore, RosterRuleConfig } from "../types";

/**
 * All-play roster rule: all picks count. No filtering.
 */
export const allPlayRule: RosterRule = {
  type: "all-play" as RosterRuleType,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apply(golferScores: GolferEntryScore[], _config: RosterRuleConfig): GolferEntryScore[] {
    // Pass-through — mark none as excluded
    return golferScores.map((g) => ({ ...g, isExcludedByRosterRule: false }));
  },
};
