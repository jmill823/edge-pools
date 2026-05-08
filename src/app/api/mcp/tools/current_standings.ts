// current_standings — commissioner read tool.
// Wraps the data behind GET /api/pools/[id]/leaderboard. Queries Prisma
// directly because the existing route uses Clerk session cookies and the
// MCP auth bridge isn't built until Day 4 (see Gate A scope note for the
// rationale on duplicating read logic vs touching the existing route).
//
// Reshapes the upstream-style payload into the agent-facing
// {tournament_status, players[]} shape per spec § Tool Surface #1.

import { prisma } from "@/lib/db";
import {
  calculatePoolResults,
  getCategoryAbbrev,
} from "@/lib/scoring/engine";
import type {
  EntryData,
  EntryGolferData,
  GolferRoundData,
  GolferTournamentData,
  MissedCutPenalty,
  PoolScoringConfig,
  RosterRuleMode,
  RosterRuleType,
  ScoringType,
  TiebreakerRule,
} from "@/lib/scoring/types";
import { requireOrganizer } from "../auth";
import { ERROR_CODES, type ToolError } from "../lib/errors";
import type {
  CurrentStandingsOutput,
  StandingsPick,
  StandingsPlayer,
} from "../lib/types";

export interface CurrentStandingsInput {
  pool_id: string;
}

export type CurrentStandingsResult =
  | { ok: true; data: CurrentStandingsOutput }
  | { ok: false; error: ToolError };

export async function runCurrentStandings(
  input: CurrentStandingsInput,
  commissionerId: string
): Promise<CurrentStandingsResult> {
  if (!input.pool_id || typeof input.pool_id !== "string") {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.INPUT_INVALID.code,
        status: ERROR_CODES.INPUT_INVALID.status,
        message: "pool_id is required and must be a string.",
      },
    };
  }

  const orgCheck = await requireOrganizer(commissionerId, input.pool_id);
  if (!orgCheck.ok) return { ok: false, error: orgCheck.error };

  const pool = await prisma.pool.findUnique({
    where: { id: input.pool_id },
    include: {
      tournament: true,
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!pool) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.POOL_NOT_FOUND.code,
        status: ERROR_CODES.POOL_NOT_FOUND.status,
        message: `Pool ${input.pool_id} not found.`,
      },
    };
  }

  const entries = await prisma.entry.findMany({
    where: { poolId: pool.id },
    include: {
      user: { select: { id: true, displayName: true } },
      guestPlayer: { select: { id: true, displayName: true } },
      picks: {
        include: {
          golfer: { select: { id: true, name: true, country: true } },
          originalGolfer: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, sortOrder: true } },
        },
      },
    },
    orderBy: [{ rank: "asc" }, { submittedAt: "asc" }],
  });

  const golferIds = Array.from(
    new Set(entries.flatMap((e) => e.picks.map((p) => p.golferId)))
  );
  const allScores = await prisma.golferScore.findMany({
    where: { golferId: { in: golferIds }, tournamentId: pool.tournamentId },
    orderBy: { round: "asc" },
  });

  const golferDataMap = buildGolferDataMap(golferIds, allScores, entries);
  const currentRound =
    allScores.length > 0 ? Math.max(...allScores.map((s) => s.round)) : null;

  const latestPerGolfer = new Map<string, (typeof allScores)[number]>();
  for (const s of allScores) {
    const existing = latestPerGolfer.get(s.golferId);
    if (!existing || s.round > existing.round) {
      latestPerGolfer.set(s.golferId, s);
    }
  }
  const onCourse = Array.from(latestPerGolfer.values()).filter(
    (s) =>
      s.holesCompleted > 0 &&
      s.holesCompleted < 18 &&
      s.position !== "CUT" &&
      s.position !== "WD"
  ).length;

  const scoringConfig: PoolScoringConfig = {
    scoringType: (pool.scoringType || "to-par") as ScoringType,
    missedCutPenaltyType: (pool.missedCutPenaltyType ||
      "carry-score") as MissedCutPenalty,
    missedCutFixedPenalty: pool.missedCutFixedPenalty ?? 4,
    tiebreakerRule: (pool.tiebreakerRule || "entry-timestamp") as TiebreakerRule,
    rosterRule: (pool.rosterRule || "all-play") as RosterRuleType,
    rosterRuleMode: (pool.rosterRuleMode || "per-tournament") as RosterRuleMode,
    rosterRuleCount: pool.rosterRuleCount,
  };

  const entryData: EntryData[] = entries.map((entry) => {
    const ownerName =
      entry.user?.displayName ?? entry.guestPlayer?.displayName ?? "Unknown";
    return {
      entryId: entry.id,
      teamName: entry.teamName || ownerName,
      userId: entry.userId,
      submittedAt: entry.submittedAt,
      golfers: entry.picks.map(
        (pick): EntryGolferData => ({
          golferId: pick.golferId,
          golferName: pick.golfer.name,
          golferCountry: pick.golfer.country,
          categoryId: pick.categoryId,
          categoryName: pick.category.name,
          categoryAbbrev: getCategoryAbbrev(pick.category.name),
          categorySortOrder: pick.category.sortOrder,
          isReplacement: pick.isReplacement,
          originalGolferName: pick.originalGolfer?.name ?? null,
        })
      ),
    };
  });

  const isScored = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const players: StandingsPlayer[] = [];

  if (isScored && entryData.length > 0) {
    const results = calculatePoolResults(
      scoringConfig,
      entryData,
      golferDataMap,
      commissionerId
    );
    for (const e of results.entries) {
      players.push({
        rank: e.position || null,
        rank_display: e.positionDisplay,
        team_name: e.teamName,
        total_points: e.total,
        total_display: e.totalDisplay,
        picks_by_category: buildPicksByCategory(e.golfers, golferDataMap),
      });
    }
  } else {
    // Pre-scoring: entries unranked, no scores
    for (const e of entryData) {
      players.push({
        rank: null,
        rank_display: "-",
        team_name: e.teamName,
        total_points: null,
        total_display: "-",
        picks_by_category: buildPicksByCategoryFromEntry(e, golferDataMap),
      });
    }
  }

  return {
    ok: true,
    data: {
      pool_name: pool.name,
      tournament_name: pool.tournament.name,
      tournament_status: deriveTournamentStatus(
        pool.tournament.status,
        pool.status,
        onCourse
      ),
      current_round: currentRound,
      on_course: onCourse,
      players,
    },
  };
}

// --- helpers ---

function deriveTournamentStatus(
  tournamentStatus: string,
  poolStatus: string,
  onCourse: number
): CurrentStandingsOutput["tournament_status"] {
  if (poolStatus === "ARCHIVED") return "archived";
  if (tournamentStatus === "COMPLETE") return "complete";
  if (tournamentStatus === "UPCOMING") return "upcoming";
  if (tournamentStatus === "LIVE") {
    return onCourse > 0 ? "live" : "between_rounds";
  }
  return "upcoming";
}

function buildPicksByCategory(
  golfers: Array<{
    golferId: string;
    golferName: string;
    golferCountry: string | null;
    categoryName: string;
    isReplacement?: boolean;
  }>,
  golferDataMap: Map<string, GolferTournamentData>
): Record<string, StandingsPick> {
  const out: Record<string, StandingsPick> = {};
  for (const g of golfers) {
    const data = golferDataMap.get(g.golferId);
    out[g.categoryName] = {
      golfer_name: g.golferName,
      country: g.golferCountry,
      status: data?.status ?? "active",
      score_to_par: data?.totalToPar ?? null,
      score_display: formatScore(data?.totalToPar ?? null, data?.status),
      is_replacement: g.isReplacement === true,
    };
  }
  return out;
}

function buildPicksByCategoryFromEntry(
  entry: EntryData,
  golferDataMap: Map<string, GolferTournamentData>
): Record<string, StandingsPick> {
  return buildPicksByCategory(
    entry.golfers.map((g) => ({
      golferId: g.golferId,
      golferName: g.golferName,
      golferCountry: g.golferCountry,
      categoryName: g.categoryName,
      isReplacement: g.isReplacement,
    })),
    golferDataMap
  );
}

function formatScore(
  toPar: number | null,
  status: GolferTournamentData["status"] | undefined
): string {
  if (status === "cut") return "CUT";
  if (status === "withdrawn") return "WD";
  if (toPar === null) return "-";
  if (toPar === 0) return "E";
  if (toPar > 0) return `+${toPar}`;
  return String(toPar);
}

// Mirror of buildGolferDataMap from the leaderboard route. Duplicated so
// the existing route stays untouched per spec § Files NOT to touch.
function buildGolferDataMap(
  golferIds: string[],
  allScores: Array<{
    golferId: string;
    round: number;
    roundScore: number | null;
    totalScore: number | null;
    holesCompleted: number;
    position: string | null;
  }>,
  entries: Array<{
    picks: Array<{
      golferId: string;
      golfer: { id: string; name: string; country: string | null };
    }>;
  }>
): Map<string, GolferTournamentData> {
  const golferInfo = new Map<
    string,
    { name: string; country: string | null }
  >();
  for (const entry of entries) {
    for (const pick of entry.picks) {
      golferInfo.set(pick.golferId, {
        name: pick.golfer.name,
        country: pick.golfer.country,
      });
    }
  }

  const map = new Map<string, GolferTournamentData>();
  for (const golferId of golferIds) {
    const scores = allScores.filter((s) => s.golferId === golferId);
    const info = golferInfo.get(golferId);

    if (scores.length === 0) {
      map.set(golferId, {
        golferId,
        name: info?.name ?? "Unknown",
        country: info?.country ?? null,
        position: null,
        status: "active",
        thru: null,
        currentRound: null,
        rounds: [],
        totalToPar: null,
        totalStrokes: null,
      });
      continue;
    }

    const latest = scores.reduce((a, b) => (a.round > b.round ? a : b));
    let status: GolferTournamentData["status"] = "active";
    if (latest.position === "CUT") status = "cut";
    else if (latest.position === "WD") status = "withdrawn";
    else if (latest.holesCompleted >= 18 && latest.round >= 4)
      status = "complete";

    const thru =
      status === "cut" || status === "withdrawn"
        ? null
        : latest.holesCompleted;

    const rounds: GolferRoundData[] = scores.map((s) => ({
      round: s.round,
      strokes:
        s.roundScore !== null && s.totalScore !== null ? s.roundScore : null,
      scoreToPar: s.roundScore,
      holesCompleted: s.holesCompleted,
      isComplete: s.holesCompleted >= 18,
    }));

    map.set(golferId, {
      golferId,
      name: info?.name ?? "Unknown",
      country: info?.country ?? null,
      position: latest.position,
      status,
      thru,
      currentRound: latest.round,
      rounds,
      totalToPar: latest.totalScore,
      totalStrokes: null,
    });
  }
  return map;
}
