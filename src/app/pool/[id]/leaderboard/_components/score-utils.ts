/** Format a score relative to par: -12, +4, or E */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || score === 0) return "E";
  if (score > 0) return `+${score}`;
  return `${score}`;
}

/** Tailwind color class for a score */
export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined || score === 0) return "text-text-secondary";
  if (score < 0) return "text-accent-success";
  return "text-accent-danger";
}

/** Format rank with tie prefix: #1, T2, T2, #4 */
export function formatRank(rank: number | null | undefined): string {
  if (!rank) return "\u2014";
  return `${rank}`;
}

/** Check if two entries share a rank (for tie display) */
export function isTied(rank: number | null, allRanks: (number | null)[]): boolean {
  if (!rank) return false;
  return allRanks.filter((r) => r === rank).length > 1;
}

/** Format rank with tie awareness */
export function formatRankWithTies(rank: number | null, allRanks: (number | null)[]): string {
  if (!rank) return "\u2014";
  if (isTied(rank, allRanks)) return `T${rank}`;
  return `${rank}`;
}
