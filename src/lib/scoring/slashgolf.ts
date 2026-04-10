/**
 * SlashGolf API client — fetches live leaderboard data via RapidAPI.
 *
 * Real response shape (verified against 2025 Masters data):
 *   leaderboardRows[].playerId   – string id e.g. "28237"
 *   leaderboardRows[].firstName  – "Rory"
 *   leaderboardRows[].lastName   – "McIlroy"
 *   leaderboardRows[].position   – "1", "T5", "CUT", "WD"
 *   leaderboardRows[].status     – "complete", "active", "cut", "wd"
 *   leaderboardRows[].total      – "-11", "+3", "E" (string, relative to par)
 *   leaderboardRows[].currentRound – { $numberInt: "4" }
 *   leaderboardRows[].thru       – "F", "12", etc.
 *   leaderboardRows[].rounds[]   – { scoreToPar: "-6", roundId: { $numberInt: "2" }, strokes: { $numberInt: "66" } }
 */

export interface SlashGolfRow {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string; // "complete" | "active" | "cut" | "wd"
  total: string; // "-11", "+3", "E"
  currentRound: { $numberInt: string };
  currentRoundScore: string;
  thru: string;
  rounds: Array<{
    scoreToPar: string;
    roundId: { $numberInt: string };
    strokes: { $numberInt: string };
  }>;
}

export interface SlashGolfLeaderboard {
  orgId: string;
  year: string;
  tournId: string;
  status: string;
  roundId: { $numberInt: string };
  roundStatus: string;
  lastUpdated: { $date: { $numberLong: string } };
  leaderboardRows: SlashGolfRow[];
}

/** Parse SlashGolf score string to numeric (relative to par). "E" → 0, "-11" → -11, "+3" → 3 */
export function parseScore(s: string | null | undefined): number {
  if (!s || s === "E") return 0;
  return parseInt(s, 10);
}

// ── Scorecard (hole-by-hole) types ──

export interface SlashGolfHole {
  holeId: { $numberInt: string };
  holeScore: { $numberInt: string };
  par: { $numberInt: string };
}

export interface SlashGolfScorecard {
  orgId: string;
  year: string;
  tournId: string;
  courseId: string;
  playerId: string;
  lastName: string;
  firstName: string;
  roundId: { $numberInt: string };
  startingHole: { $numberInt: string };
  roundComplete: boolean;
  currentRoundScore: string;
  currentHole: { $numberInt: string };
  holes: Record<string, SlashGolfHole>;
  totalShots: { $numberInt: string };
}

/**
 * Fetch hole-by-hole scorecard for a specific player + round.
 * Returns an array (usually length 1) of scorecard objects.
 */
export async function fetchScorecard(
  tournId: string,
  year: number,
  roundId: number,
  playerId: string
): Promise<SlashGolfScorecard[]> {
  const apiKey = process.env.SLASHGOLF_API_KEY;
  const apiHost = process.env.SLASHGOLF_API_HOST || "live-golf-data.p.rapidapi.com";

  if (!apiKey) throw new Error("SLASHGOLF_API_KEY not set");

  const url = `https://${apiHost}/scorecard?orgId=1&tournId=${tournId}&year=${year}&roundId=${roundId}&playerId=${playerId}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": apiHost,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`SlashGolf scorecard error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Leaderboard fetch ──

export async function fetchLeaderboard(
  tournId: string,
  year: number
): Promise<SlashGolfLeaderboard> {
  const apiKey = process.env.SLASHGOLF_API_KEY;
  const apiHost = process.env.SLASHGOLF_API_HOST || "live-golf-data.p.rapidapi.com";

  if (!apiKey) throw new Error("SLASHGOLF_API_KEY not set");

  const url = `https://${apiHost}/leaderboard?orgId=1&tournId=${tournId}&year=${year}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": apiHost,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`SlashGolf API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
