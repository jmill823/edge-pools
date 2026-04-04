/**
 * Golf utility functions — name formatting, flag emoji, category colors.
 * Used across picks grid, bubble strip, pick strips, and leaderboard.
 */

// ── Category Earth-Tone Color Palette ──────────────────────────────────────
// Each of the 9 categories gets a distinct earth-tone color ramp.
// Assigned by category index (sortOrder - 1). Stable per pool.

export interface CategoryColor {
  fill: string;    // Background
  text: string;    // Text on fill
  dot: string;     // Avatar / dot accent
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { fill: "#E8F0E5", text: "#2D5F3B", dot: "#3D8B54" }, // 1 Forest
  { fill: "#EDE8DF", text: "#6B5D3F", dot: "#8B7A52" }, // 2 Khaki
  { fill: "#E0EDE4", text: "#1B5E3B", dot: "#2D7A4F" }, // 3 Deep Green
  { fill: "#F0EBDF", text: "#7A6B45", dot: "#A69360" }, // 4 Golden Tan
  { fill: "#E4EAE0", text: "#3E6B4A", dot: "#4E8B60" }, // 5 Sage
  { fill: "#EAE5D8", text: "#5F543A", dot: "#7A6E4E" }, // 6 Olive
  { fill: "#DCE8DC", text: "#2A5A38", dot: "#3A7D4E" }, // 7 Moss
  { fill: "#EEE9E0", text: "#6E5F42", dot: "#917F58" }, // 8 Warm Brown
  { fill: "#E2EBE0", text: "#365F42", dot: "#488B5A" }, // 9 Emerald
];

/**
 * Get the category color ramp by zero-based index.
 * Wraps around if more than 9 categories.
 */
export function getCategoryColor(index: number): CategoryColor {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// ── Name Abbreviation ──────────────────────────────────────────────────────

/**
 * Abbreviate a golfer's full name to "F. Last" format.
 *
 * Examples:
 *   "Tiger Woods"       → "T. Woods"
 *   "Min Woo Lee"       → "M.W. Lee"
 *   "Robert MacIntyre"  → "R. MacIntyre"
 *   "Byeong Hun An"     → "B.H. An"
 *   "Xander Schauffele" → "X. Schauffele"
 *   "Scottie"           → "Scottie"  (single-word: as-is)
 */
export function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;

  const lastName = parts[parts.length - 1];
  const firstParts = parts.slice(0, -1);

  const initials = firstParts.map((p) => p.charAt(0).toUpperCase() + ".").join("");
  return `${initials} ${lastName}`;
}

/**
 * Get initials from a full name (first letter of first + last name).
 * Used for avatar circles.
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Country Code → Flag Emoji ──────────────────────────────────────────────

/**
 * Map golf-specific 3-letter country codes to ISO 3166-1 alpha-2 codes.
 * Golf uses non-standard codes for UK constituent nations, etc.
 */
const GOLF_TO_ISO: Record<string, string> = {
  USA: "US",
  ENG: "GB",   // England → GB flag (no England flag in Unicode standard)
  SCO: "GB",   // Scotland → GB flag
  NIR: "GB",   // Northern Ireland → GB flag (closest standard)
  WAL: "GB",   // Wales → GB flag
  IRL: "IE",   // Republic of Ireland
  AUS: "AU",
  CAN: "CA",
  ESP: "ES",
  JPN: "JP",
  KOR: "KR",
  SWE: "SE",
  NOR: "NO",
  AUT: "AT",
  RSA: "ZA",   // South Africa
  CHI: "CL",   // Chile
  ARG: "AR",
  FRA: "FR",
  GER: "DE",
  ITA: "IT",
  MEX: "MX",
  COL: "CO",
  IND: "IN",
  CHN: "CN",
  THA: "TH",
  TPE: "TW",   // Chinese Taipei → Taiwan
  FIJ: "FJ",
  NZL: "NZ",
  DEN: "DK",
  BEL: "BE",
  NED: "NL",
  POR: "PT",
  PAR: "PY",
  VEN: "VE",
  ZIM: "ZW",
};

/**
 * Convert a country code (2 or 3 letter) to a flag emoji.
 * Returns empty string if code is unknown or null.
 */
export function countryToFlag(code: string | null | undefined): string {
  if (!code) return "";

  // Normalize to uppercase
  const upper = code.toUpperCase().trim();

  // If it's already 2 letters, use directly
  const iso2 = upper.length === 2 ? upper : GOLF_TO_ISO[upper];
  if (!iso2) return "";

  // Convert ISO 3166-1 alpha-2 to regional indicator symbols
  const codePoints = iso2.split("").map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}
