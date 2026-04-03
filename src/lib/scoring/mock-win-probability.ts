/**
 * Generate plausible %ToWin based on team score and rank.
 * This will be replaced by DataGolf integration later.
 */
export function calculateMockWinProbability(
  teamScore: number | null,
  rank: number | null,
  totalEntries: number
): number {
  if (teamScore === null || rank === null || totalEntries === 0) return 0;

  // Simple model: higher rank = higher probability, drops off exponentially
  // Leader gets ~8-15%, drops off quickly
  const baseProb = Math.max(0, 15 * Math.exp(-0.3 * (rank - 1)));

  // Deterministic pseudo-random noise for realism
  const noise = (Math.sin(rank * 7.3) + 1) * 0.5;
  const adjusted = baseProb * (0.8 + noise * 0.4);

  return Math.round(adjusted * 10) / 10; // one decimal
}
