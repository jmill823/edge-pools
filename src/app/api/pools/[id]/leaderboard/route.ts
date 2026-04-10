import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePoolResults, getCategoryAbbrev } from "@/lib/scoring/engine";
import type {
  PoolScoringConfig,
  GolferTournamentData,
  GolferRoundData,
  EntryData,
  EntryGolferData,
  ScoringType,
  MissedCutPenalty,
  TiebreakerRule,
  RosterRuleType,
  RosterRuleMode,
} from "@/lib/scoring/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: true,
      members: { where: { userId: user.id } },
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.members.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Fetch all entries with picks
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

  // Get ALL golfer scores for this tournament (all rounds)
  const golferIds = Array.from(
    new Set(entries.flatMap((e) => e.picks.map((p) => p.golferId)))
  );

  const allGolferScores = await prisma.golferScore.findMany({
    where: {
      golferId: { in: golferIds },
      tournamentId: pool.tournamentId,
    },
    orderBy: { round: "asc" },
  });

  // Build GolferTournamentData map
  const golferDataMap = buildGolferDataMap(golferIds, allGolferScores, entries);

  // Current round from scores
  const currentRound =
    allGolferScores.length > 0
      ? Math.max(...allGolferScores.map((s) => s.round))
      : null;

  // Count golfers on course
  const latestScores = new Map<string, typeof allGolferScores[0]>();
  for (const s of allGolferScores) {
    const existing = latestScores.get(s.golferId);
    if (!existing || s.round > existing.round) {
      latestScores.set(s.golferId, s);
    }
  }
  const onCourse = Array.from(latestScores.values()).filter(
    (s) =>
      s.holesCompleted > 0 &&
      s.holesCompleted < 18 &&
      s.position !== "CUT" &&
      s.position !== "WD"
  ).length;

  // Pending replacements
  const pendingReplacements = await prisma.pendingReplacement.count({
    where: { poolId: pool.id, status: "PENDING" },
  });

  // Build scoring config from pool record
  // Cast to any because Prisma client may not have the new fields yet
  const poolAny = pool as Record<string, unknown>;
  const scoringConfig = buildScoringConfig({
    scoringType: (poolAny.scoringType as string) || "to-par",
    missedCutPenaltyType: (poolAny.missedCutPenaltyType as string) || "carry-score",
    missedCutFixedPenalty: (poolAny.missedCutFixedPenalty as number | null) ?? 4,
    tiebreakerRule: (poolAny.tiebreakerRule as string) || "entry-timestamp",
    rosterRule: (poolAny.rosterRule as string) || "all-play",
    rosterRuleMode: (poolAny.rosterRuleMode as string) || "per-tournament",
    rosterRuleCount: (poolAny.rosterRuleCount as number | null) ?? null,
  });

  // Build entry data for engine
  const entryData: EntryData[] = entries.map((entry) => {
    const ownerName =
      entry.user?.displayName ?? entry.guestPlayer?.displayName ?? "Unknown";
    return {
      entryId: entry.id,
      teamName: entry.teamName || ownerName,
      userId: entry.userId,
      submittedAt: entry.submittedAt,
      golfers: entry.picks.map((pick): EntryGolferData => ({
        golferId: pick.golferId,
        golferName: pick.golfer.name,
        golferCountry: pick.golfer.country,
        categoryId: pick.categoryId,
        categoryName: pick.category.name,
        categoryAbbrev: getCategoryAbbrev(pick.category.name),
        categorySortOrder: pick.category.sortOrder,
        isReplacement: pick.isReplacement,
        originalGolferName: pick.originalGolfer?.name ?? null,
      })),
    };
  });

  // Run scoring engine
  const isScored = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);

  let results;
  if (isScored && entryData.length > 0) {
    results = calculatePoolResults(
      scoringConfig,
      entryData,
      golferDataMap,
      user.id
    );
  } else {
    // Pre-scoring: return entries unranked with golfer data
    results = {
      entries: entryData.map((entry) => ({
        entryId: entry.entryId,
        teamName: entry.teamName,
        userId: entry.userId,
        submittedAt: entry.submittedAt,
        position: 0,
        positionDisplay: "-",
        total: 0,
        totalDisplay: "-",
        totalColor: "neutral" as const,
        roundScores: [1, 2, 3, 4].map((round) => ({
          round,
          score: null,
          display: "-",
          color: "neutral" as const,
        })),
        activePicks: entry.golfers.length,
        totalPicks: entry.golfers.length,
        isCurrentUser: entry.userId === user.id,
        golfers: entry.golfers.map((eg) => ({
          golferId: eg.golferId,
          golferName: eg.golferName,
          golferCountry: eg.golferCountry,
          categoryName: eg.categoryName,
          categoryAbbrev: eg.categoryAbbrev,
          categorySortOrder: eg.categorySortOrder,
          position: null,
          positionDisplay: "-",
          status: "active" as const,
          thru: null,
          thruDisplay: "-",
          roundScores: [1, 2, 3, 4].map((round) => ({
            round,
            score: null,
            display: "-",
            color: "neutral" as const,
          })),
          total: null,
          totalDisplay: "-",
          totalColor: "neutral" as const,
          isExcludedByRosterRule: false,
          isReplacement: eg.isReplacement,
          originalGolferName: eg.originalGolferName,
        })),
      })),
      rosterRuleSummary: null,
    };
  }

  // Get template name from first category qualifier or pool name
  const templateName = pool.categories.length > 0
    ? `${pool.categories.length}-cat`
    : "Custom";

  return NextResponse.json({
    pool: {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      maxEntries: pool.maxEntries,
      picksDeadline: pool.picksDeadline,
      inviteCode: pool.inviteCode,
      scoringConfig,
    },
    tournament: {
      name: pool.tournament.name,
      status: pool.tournament.status,
      lastSyncAt: pool.tournament.lastSyncAt,
      currentRound,
    },
    templateName,
    onCourse,
    pendingReplacements,
    entries: results.entries,
    rosterRuleSummary: results.rosterRuleSummary,
  });
}

// --- Helpers ---

function buildScoringConfig(pool: {
  scoringType: string;
  missedCutPenaltyType: string;
  missedCutFixedPenalty: number | null;
  tiebreakerRule: string;
  rosterRule: string;
  rosterRuleMode: string;
  rosterRuleCount: number | null;
}): PoolScoringConfig {
  return {
    scoringType: (pool.scoringType || "to-par") as ScoringType,
    missedCutPenaltyType: (pool.missedCutPenaltyType || "carry-score") as MissedCutPenalty,
    missedCutFixedPenalty: pool.missedCutFixedPenalty ?? 4,
    tiebreakerRule: (pool.tiebreakerRule || "entry-timestamp") as TiebreakerRule,
    rosterRule: (pool.rosterRule || "all-play") as RosterRuleType,
    rosterRuleMode: (pool.rosterRuleMode || "per-tournament") as RosterRuleMode,
    rosterRuleCount: pool.rosterRuleCount,
  };
}

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
  // Build golfer name lookup
  const golferInfo = new Map<string, { name: string; country: string | null }>();
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
      // No scores yet
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

    // Get latest score record for position/status
    const latest = scores.reduce((a, b) => (a.round > b.round ? a : b));

    // Determine status
    let status: "active" | "cut" | "withdrawn" | "complete" = "active";
    if (latest.position === "CUT") status = "cut";
    else if (latest.position === "WD") status = "withdrawn";
    else if (latest.holesCompleted >= 18 && latest.round >= 4)
      status = "complete";

    // Determine thru (current round holes completed)
    const thru =
      status === "cut" || status === "withdrawn"
        ? null
        : latest.holesCompleted < 18
          ? latest.holesCompleted
          : latest.holesCompleted;

    // Build round data
    const rounds: GolferRoundData[] = scores.map((s) => ({
      round: s.round,
      strokes: s.roundScore !== null && s.totalScore !== null
        ? s.roundScore // roundScore in GolferScore is actually scoreToPar from SlashGolf
        : null,
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
      totalStrokes: null, // Not tracked separately in current schema
    });
  }

  return map;
}
