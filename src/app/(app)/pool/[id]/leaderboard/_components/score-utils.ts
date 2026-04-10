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

/** Color class for a single hole score relative to par */
export function holeScoreColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "text-[#1B5E3B] bg-[#D4EDDA]"; // eagle or better — bold green bg
  if (diff === -1) return "text-accent-success";           // birdie — green text
  if (diff === 0) return "text-text-secondary";            // par — neutral
  if (diff === 1) return "text-accent-danger";             // bogey — red text
  return "text-[#8B2D27] bg-[#FCEAE9]";                   // double+ — bold red bg
}

/** Short label for a hole score relative to par */
export function holeScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Dbl Bogey";
  return `+${diff}`;
}
