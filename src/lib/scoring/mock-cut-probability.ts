/**
 * Generate plausible Cut% based on individual golfer scores.
 * Cut% = percentage of team's golfers at risk of missing the cut.
 * This will be replaced by DataGolf integration later.
 */
export function calculateMockCutProbability(
  golferScores: Array<{ totalScore: number | null; position: string | null }>
): number {
  if (!golferScores.length) return 0;

  const atRisk = golferScores.filter((g) => {
    if (g.position === "CUT" || g.position === "WD") return true;
    if (g.totalScore !== null && g.totalScore > 2) return true; // over +2 is at risk
    return false;
  });

  return Math.round((atRisk.length / golferScores.length) * 100);
}
