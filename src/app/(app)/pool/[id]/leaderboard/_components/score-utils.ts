import type { ScoreColor } from "@/lib/scoring/types";

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

/** Map ScoreColor enum to Tailwind class */
export function scoreColorClass(color: ScoreColor): string {
  switch (color) {
    case "under": return "text-accent-success";
    case "over": return "text-accent-danger";
    case "even": return "text-text-secondary";
    case "neutral": return "text-text-muted";
  }
}

/** Format rank with tie prefix: T1, T2, 4 */
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
  if (diff <= -2) return "text-[#1B5E3B] bg-[#D4EDDA]";
  if (diff === -1) return "text-accent-success";
  if (diff === 0) return "text-text-secondary";
  if (diff === 1) return "text-accent-danger";
  return "text-[#8B2D27] bg-[#FCEAE9]";
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

/** Format golfer name as F. LastName */
export function formatGolferNameShort(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return `${firstName.charAt(0)}. ${lastName}`;
}
