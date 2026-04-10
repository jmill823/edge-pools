import type {
  PoolScoringConfig,
  GolferTournamentData,
  EntryData,
  EntryScore,
  GolferEntryScore,
  RoundScoreDisplay,
  ScoreColor,
  RosterRuleConfig,
} from "./types";
import { getStrategy } from "./strategies";
import { getRosterRule } from "./roster-rules";
import { getDisplayAdapter } from "./display";

// --- Category abbreviation map ---
const CATEGORY_ABBREVIATIONS: Record<string, string> = {
  "Past Champions": "PC",
  "World Top 10": "Top10",
  "Contenders": "CONT",
  "Dark Horses": "DH",
  "Veterans": "VET",
  "International": "INTL",
  "Rising Stars": "RS",
  "Favorites": "FAV",
  "Longshots": "LNG",
};

export function getCategoryAbbrev(categoryName: string): string {
  // Check known abbreviations first
  if (CATEGORY_ABBREVIATIONS[categoryName]) {
    return CATEGORY_ABBREVIATIONS[categoryName];
  }
  // Fallback: first 3 chars uppercase
  return categoryName.slice(0, 3).toUpperCase();
}

// --- Roster rule summary text ---
export function getRosterRuleSummary(config: PoolScoringConfig, totalPicks: number): string | null {
  if (config.rosterRule === "all-play") return null;

  if (config.rosterRule === "best-of" && config.rosterRuleCount) {
    return `Best ${config.rosterRuleCount} of ${totalPicks} count toward total`;
  }

  if (config.rosterRule === "drop-worst" && config.rosterRuleCount) {
    const label = config.rosterRuleCount === 1 ? "Worst score dropped" : `Worst ${config.rosterRuleCount} scores dropped`;
    return label;
  }

  return null;
}

/**
 * Main engine function: calculate pool results.
 *
 * Takes pool config, entries, and golfer tournament data.
 * Returns ranked entries with all display data.
 */
export function calculatePoolResults(
  config: PoolScoringConfig,
  entries: EntryData[],
  golferDataMap: Map<string, GolferTournamentData>,
  currentUserId: string | null
): { entries: EntryScore[]; rosterRuleSummary: string | null } {
  const strategy = getStrategy(config.scoringType);
  const display = getDisplayAdapter(config.scoringType);
  const rosterRule = getRosterRule(config.rosterRule);
  const allGolferData = Array.from(golferDataMap.values());

  const rosterRuleConfig: RosterRuleConfig = {
    type: config.rosterRule,
    mode: config.rosterRuleMode,
    count: config.rosterRuleCount,
  };

  // Calculate scores for each entry
  const scoredEntries: EntryScore[] = entries.map((entry) => {
    // 1. Build golfer scores for this entry
    const golferScores: GolferEntryScore[] = entry.golfers
      .sort((a, b) => a.categorySortOrder - b.categorySortOrder)
      .map((eg) => {
        const gData = golferDataMap.get(eg.golferId);

        const golferTotal = gData
          ? strategy.calculateGolferTotal(gData, config, allGolferData)
          : null;

        const status = gData?.status ?? "active";
        const position = gData?.position ?? null;
        const thru = gData?.thru ?? null;

        // Build per-round scores
        const roundScores: RoundScoreDisplay[] = [1, 2, 3, 4].map((round) => {
          const roundData = gData?.rounds.find((r) => r.round === round);

          let score: number | null = null;
          if (roundData) {
            score = config.scoringType === "to-par"
              ? roundData.scoreToPar
              : roundData.strokes;
          }

          return {
            round,
            score,
            display: display.formatRoundScore(score),
            color: config.scoringType === "to-par"
              ? display.getScoreColor(roundData?.scoreToPar ?? null)
              : display.getScoreColor(null), // strokes: no color
          };
        });

        // Format thru display
        let thruDisplay = "-";
        if (status === "cut") thruDisplay = "MC";
        else if (status === "withdrawn") thruDisplay = "WD";
        else if (thru !== null && thru >= 18) thruDisplay = "F";
        else if (thru !== null && thru > 0) thruDisplay = `${thru}`;

        return {
          golferId: eg.golferId,
          golferName: eg.golferName,
          golferCountry: eg.golferCountry,
          categoryName: eg.categoryName,
          categoryAbbrev: eg.categoryAbbrev,
          categorySortOrder: eg.categorySortOrder,
          position: position,
          positionDisplay: position ?? "-",
          status,
          thru,
          thruDisplay,
          roundScores,
          total: golferTotal,
          totalDisplay: golferTotal !== null ? display.formatTotal(golferTotal) : "-",
          totalColor: display.getScoreColor(golferTotal),
          isExcludedByRosterRule: false,
          isReplacement: eg.isReplacement,
          originalGolferName: eg.originalGolferName,
        };
      });

    // 2. Apply roster rule
    const processedGolfers = rosterRule.apply(golferScores, rosterRuleConfig);

    // 3. Calculate entry total from non-excluded golfers
    const includedTotals = processedGolfers
      .filter((g) => !g.isExcludedByRosterRule)
      .map((g) => g.total);

    const entryTotal = strategy.calculateEntryTotal(includedTotals);

    // 4. Calculate per-round aggregates for the entry
    const entryRoundScores: RoundScoreDisplay[] = [1, 2, 3, 4].map((round) => {
      const roundGolferScores = processedGolfers
        .filter((g) => !g.isExcludedByRosterRule)
        .map((g) => g.roundScores.find((r) => r.round === round)?.score ?? null);

      // For per-round roster rule mode, apply best-of/drop-worst per round
      let filteredScores = roundGolferScores;
      if (
        config.rosterRuleMode === "per-round" &&
        config.rosterRule !== "all-play" &&
        config.rosterRuleCount
      ) {
        const nonNull = roundGolferScores
          .filter((s): s is number => s !== null)
          .sort((a, b) => a - b); // ascending for asc scoring types

        if (config.rosterRule === "best-of") {
          filteredScores = nonNull.slice(0, config.rosterRuleCount);
        } else if (config.rosterRule === "drop-worst") {
          filteredScores = nonNull.slice(0, nonNull.length - config.rosterRuleCount);
        }
      }

      const roundTotal = filteredScores.reduce(
        (sum: number, s) => sum + (s ?? 0),
        0
      );
      const hasAnyScore = filteredScores.some((s) => s !== null);

      return {
        round,
        score: hasAnyScore ? roundTotal : null,
        display: hasAnyScore ? display.formatRoundScore(roundTotal) : "-",
        color: hasAnyScore
          ? display.getScoreColor(roundTotal)
          : ("neutral" as ScoreColor),
      };
    });

    // Count active picks (not MC/WD)
    const activePicks = processedGolfers.filter(
      (g) => g.status === "active" || g.status === "complete"
    ).length;

    return {
      entryId: entry.entryId,
      teamName: entry.teamName,
      userId: entry.userId,
      submittedAt: entry.submittedAt,
      position: 0,
      positionDisplay: "-",
      total: entryTotal,
      totalDisplay: display.formatTotal(entryTotal),
      totalColor: display.getScoreColor(entryTotal),
      roundScores: entryRoundScores,
      activePicks,
      totalPicks: processedGolfers.length,
      isCurrentUser: entry.userId === currentUserId,
      golfers: processedGolfers,
    };
  });

  // 5. Assign positions
  const ranked = strategy.assignPositions(scoredEntries);

  // 6. Apply tiebreaker within tied groups
  const finalEntries = applyTiebreakers(ranked, strategy, config.tiebreakerRule);

  // Build roster rule summary
  const sampleTotalPicks = entries[0]?.golfers.length ?? 0;
  const rosterRuleSummary = getRosterRuleSummary(config, sampleTotalPicks);

  return { entries: finalEntries, rosterRuleSummary };
}

function applyTiebreakers(
  entries: EntryScore[],
  strategy: ReturnType<typeof getStrategy>,
  tiebreakerRule: PoolScoringConfig["tiebreakerRule"]
): EntryScore[] {
  if (tiebreakerRule === "none") return entries;

  // Group by position
  const groups = new Map<number, EntryScore[]>();
  for (const entry of entries) {
    const group = groups.get(entry.position) ?? [];
    group.push(entry);
    groups.set(entry.position, group);
  }

  const result: EntryScore[] = [];
  for (const group of Array.from(groups.values())) {
    if (group.length <= 1) {
      result.push(...group);
    } else {
      const resolved = strategy.resolveTiebreaker(group, tiebreakerRule);
      result.push(...resolved);
    }
  }

  return result;
}
