import { prisma } from "../db";
import { fetchLeaderboard, parseScore } from "./slashgolf";
import { getStrategy } from "./strategies";
import type {
  ScoringType,
  MissedCutPenalty,
  TiebreakerRule,
  RosterRuleType,
  RosterRuleMode,
  PoolScoringConfig,
  GolferTournamentData,
  GolferRoundData,
} from "./types";

interface PollResult {
  tournament: string;
  golfersUpdated: number;
  poolsRecalculated: number;
  replacementsFlagged: number;
  errors: string[];
}

/**
 * Main polling function. Called by cron or manual trigger.
 * For each LIVE tournament: fetch scores, upsert GolferScore records,
 * detect WD/CUT, recalculate standings.
 */
export async function pollAllLiveTournaments(): Promise<PollResult[]> {
  const liveTournaments = await prisma.tournament.findMany({
    where: { status: "LIVE" },
  });

  if (liveTournaments.length === 0) return [];

  const results: PollResult[] = [];

  for (const tournament of liveTournaments) {
    const result = await pollTournamentScores(tournament.id, tournament.slashGolfTournId, tournament.year);
    results.push(result);
  }

  return results;
}

async function pollTournamentScores(
  tournamentId: string,
  slashGolfTournId: string | null,
  year: number
): Promise<PollResult> {
  const result: PollResult = {
    tournament: tournamentId,
    golfersUpdated: 0,
    poolsRecalculated: 0,
    replacementsFlagged: 0,
    errors: [],
  };

  if (!slashGolfTournId) {
    result.errors.push("No slashGolfTournId configured for this tournament");
    return result;
  }

  try {
    const leaderboard = await fetchLeaderboard(slashGolfTournId, year);

    for (const row of leaderboard.leaderboardRows) {
      try {
        // Map SlashGolf player ID → Edge Pools golfer
        const golfer = await prisma.golfer.findUnique({
          where: { slashGolfId: row.playerId },
        });

        if (!golfer) {
          // Skip unmapped golfers silently (they may not be in any pool)
          continue;
        }

        const totalScore = parseScore(row.total);

        // Upsert score for each completed round
        for (const round of row.rounds) {
          const roundNumber = parseInt(round.roundId.$numberInt, 10);
          const roundScore = parseScore(round.scoreToPar);

          await prisma.golferScore.upsert({
            where: {
              golferId_tournamentId_round: {
                golferId: golfer.id,
                tournamentId,
                round: roundNumber,
              },
            },
            update: {
              roundScore,
              totalScore,
              position: row.position,
              holesCompleted: roundNumber < parseInt(row.currentRound.$numberInt, 10)
                ? 18
                : row.thru === "F"
                  ? 18
                  : parseInt(row.thru, 10) || 0,
            },
            create: {
              golferId: golfer.id,
              tournamentId,
              round: roundNumber,
              roundScore,
              totalScore,
              position: row.position,
              holesCompleted: roundNumber < parseInt(row.currentRound.$numberInt, 10)
                ? 18
                : row.thru === "F"
                  ? 18
                  : parseInt(row.thru, 10) || 0,
            },
          });
        }

        // Also upsert a "current" score for the active round if they haven't finished it
        if (row.status === "active") {
          const currentRound = parseInt(row.currentRound.$numberInt, 10);
          const holesThru = row.thru === "F" ? 18 : parseInt(row.thru, 10) || 0;

          await prisma.golferScore.upsert({
            where: {
              golferId_tournamentId_round: {
                golferId: golfer.id,
                tournamentId,
                round: currentRound,
              },
            },
            update: {
              totalScore,
              position: row.position,
              holesCompleted: holesThru,
              roundScore: parseScore(row.currentRoundScore),
            },
            create: {
              golferId: golfer.id,
              tournamentId,
              round: currentRound,
              totalScore,
              position: row.position,
              holesCompleted: holesThru,
              roundScore: parseScore(row.currentRoundScore),
            },
          });
        }

        // Detect WD/CUT
        if (row.status === "wd" || row.status === "cut") {
          const flagged = await flagWithdrawal(
            golfer.id,
            tournamentId,
            row.status.toUpperCase()
          );
          result.replacementsFlagged += flagged;
        }

        result.golfersUpdated++;
      } catch (err) {
        result.errors.push(
          `Error processing ${row.firstName} ${row.lastName}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Recalculate standings for all pools using this tournament
    const pools = await prisma.pool.findMany({
      where: { tournamentId, status: { in: ["LIVE", "LOCKED"] } },
    });

    for (const pool of pools) {
      await recalculatePoolStandings(pool.id, tournamentId);
      result.poolsRecalculated++;
    }

    // Record sync timestamp
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { lastSyncAt: new Date() },
    });
  } catch (err) {
    result.errors.push(
      `API fetch error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

/**
 * Flag all picks referencing a WD/CUT golfer, creating PendingReplacement records.
 * Returns the count of new replacements flagged.
 */
async function flagWithdrawal(
  golferId: string,
  tournamentId: string,
  reason: string
): Promise<number> {
  // Find all picks in pools for this tournament that reference this golfer
  const affectedPicks = await prisma.pick.findMany({
    where: {
      golferId,
      isReplacement: false,
      entry: {
        pool: { tournamentId },
      },
    },
    include: {
      entry: { include: { pool: true } },
      category: {
        include: {
          golfers: { include: { golfer: true } },
        },
      },
    },
  });

  let flagged = 0;

  for (const pick of affectedPicks) {
    // Check if already has a pending/confirmed replacement
    const existing = await prisma.pendingReplacement.findFirst({
      where: {
        pickId: pick.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existing) continue;

    // Find replacement candidate: highest (worst) totalScore among eligible golfers
    const entryPicks = await prisma.pick.findMany({
      where: { entryId: pick.entryId },
      select: { golferId: true },
    });
    const pickedGolferIds = entryPicks.map((p) => p.golferId);

    // Get all golfers in this category
    const categoryGolferIds = pick.category.golfers.map((cg) => cg.golferId);

    // Filter: not already picked in this entry, not WD/CUT themselves
    const wdCutGolferScores = await prisma.golferScore.findMany({
      where: {
        tournamentId,
        position: { in: ["CUT", "WD"] },
      },
      select: { golferId: true },
    });
    const wdCutIds = new Set(wdCutGolferScores.map((s) => s.golferId));

    const eligible = categoryGolferIds.filter(
      (id) => !pickedGolferIds.includes(id) && !wdCutIds.has(id) && id !== golferId
    );

    if (eligible.length === 0) {
      // No eligible replacement — still create record with empty replacement
      await prisma.pendingReplacement.create({
        data: {
          poolId: pick.entry.poolId,
          pickId: pick.id,
          originalGolferId: golferId,
          replacementGolferId: "", // No replacement available
          reason,
          status: "PENDING",
        },
      });
      flagged++;
      continue;
    }

    // Get scores for eligible golfers, pick highest (worst) totalScore
    const scores = await prisma.golferScore.findMany({
      where: {
        golferId: { in: eligible },
        tournamentId,
      },
      orderBy: { totalScore: "desc" },
      distinct: ["golferId"],
    });

    // Golfers with no score yet default to 0
    let replacementId: string;
    if (scores.length > 0) {
      replacementId = scores[0].golferId;
    } else {
      // All eligible golfers have no scores — pick first one
      replacementId = eligible[0];
    }

    await prisma.pendingReplacement.create({
      data: {
        poolId: pick.entry.poolId,
        pickId: pick.id,
        originalGolferId: golferId,
        replacementGolferId: replacementId,
        reason,
        status: "PENDING",
      },
    });
    flagged++;
  }

  return flagged;
}

/**
 * Recalculate team scores and rankings for all entries in a pool.
 * Uses the pool's scoring config via the scoring engine.
 */
export async function recalculatePoolStandings(
  poolId: string,
  tournamentId: string
): Promise<void> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
  });

  const entries = await prisma.entry.findMany({
    where: { poolId },
    include: {
      picks: true,
      user: { select: { displayName: true } },
    },
  });

  if (entries.length === 0) return;

  // Build scoring config — cast to any because Prisma client may not be
  // regenerated yet with the new fields. They exist in DB with defaults.
  const poolAny = pool as Record<string, unknown> | null;
  const config: PoolScoringConfig = {
    scoringType: ((poolAny?.scoringType as string) || "to-par") as ScoringType,
    missedCutPenaltyType: ((poolAny?.missedCutPenaltyType as string) || "carry-score") as MissedCutPenalty,
    missedCutFixedPenalty: (poolAny?.missedCutFixedPenalty as number) ?? 4,
    tiebreakerRule: ((poolAny?.tiebreakerRule as string) || "entry-timestamp") as TiebreakerRule,
    rosterRule: ((poolAny?.rosterRule as string) || "all-play") as RosterRuleType,
    rosterRuleMode: ((poolAny?.rosterRuleMode as string) || "per-tournament") as RosterRuleMode,
    rosterRuleCount: (poolAny?.rosterRuleCount as number) ?? null,
  };

  const strategy = getStrategy(config.scoringType);

  // Batch-fetch all golfer scores for this tournament (all rounds)
  const allGolferIds = Array.from(new Set(entries.flatMap((e) => e.picks.map((p) => p.golferId))));

  const allScores = await prisma.golferScore.findMany({
    where: {
      golferId: { in: allGolferIds },
      tournamentId,
    },
    orderBy: { round: "asc" },
  });

  // Build golfer tournament data map
  const golferDataMap = new Map<string, GolferTournamentData>();
  for (const golferId of allGolferIds) {
    const scores = allScores.filter((s) => s.golferId === golferId);
    if (scores.length === 0) {
      golferDataMap.set(golferId, {
        golferId,
        name: "",
        country: null,
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
    let status: "active" | "cut" | "withdrawn" | "complete" = "active";
    if (latest.position === "CUT") status = "cut";
    else if (latest.position === "WD") status = "withdrawn";
    else if (latest.holesCompleted >= 18 && latest.round >= 4) status = "complete";

    const rounds: GolferRoundData[] = scores.map((s) => ({
      round: s.round,
      strokes: s.roundScore,
      scoreToPar: s.roundScore,
      holesCompleted: s.holesCompleted,
      isComplete: s.holesCompleted >= 18,
    }));

    golferDataMap.set(golferId, {
      golferId,
      name: "",
      country: null,
      position: latest.position,
      status,
      thru: latest.holesCompleted,
      currentRound: latest.round,
      rounds,
      totalToPar: latest.totalScore,
      totalStrokes: null,
    });
  }

  const allGolferData = Array.from(golferDataMap.values());

  // Calculate team scores using the engine
  const scored: Array<{ id: string; teamScore: number; submittedAt: Date }> = [];

  for (const entry of entries) {
    const golferTotals = entry.picks.map((pick) => {
      const gData = golferDataMap.get(pick.golferId);
      if (!gData) return null;
      return strategy.calculateGolferTotal(gData, config, allGolferData);
    });

    // Apply roster rule (simplified — just filter totals)
    let filteredTotals = golferTotals;
    if (config.rosterRule !== "all-play" && config.rosterRuleCount) {
      const nonNull = golferTotals
        .map((t, i) => ({ total: t, idx: i }))
        .filter((g) => g.total !== null)
        .sort((a, b) => (a.total as number) - (b.total as number));

      if (config.rosterRule === "best-of") {
        const keepIds = new Set(nonNull.slice(0, config.rosterRuleCount).map((g) => g.idx));
        filteredTotals = golferTotals.map((t, i) => keepIds.has(i) ? t : null);
      } else if (config.rosterRule === "drop-worst") {
        const dropIds = new Set(nonNull.slice(-config.rosterRuleCount).map((g) => g.idx));
        filteredTotals = golferTotals.map((t, i) => dropIds.has(i) ? null : t);
      }
    }

    const teamScore = strategy.calculateEntryTotal(filteredTotals.filter((t) => t !== null));
    scored.push({ id: entry.id, teamScore, submittedAt: entry.submittedAt });
  }

  // Sort: ascending for to-par/strokes
  scored.sort((a, b) => {
    if (a.teamScore !== b.teamScore) {
      return strategy.sortDirection === "asc"
        ? a.teamScore - b.teamScore
        : b.teamScore - a.teamScore;
    }
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });

  // Assign ranks with tie handling
  const ranks: Array<{ id: string; rank: number }> = [];
  for (let i = 0; i < scored.length; i++) {
    let rank = i + 1;
    for (let j = 0; j < i; j++) {
      if (scored[j].teamScore === scored[i].teamScore) {
        rank = ranks[j].rank;
        break;
      }
    }
    ranks.push({ id: scored[i].id, rank });
  }

  // Batch update
  for (let i = 0; i < scored.length; i++) {
    const entry = entries.find((e) => e.id === scored[i].id)!;
    await prisma.entry.update({
      where: { id: scored[i].id },
      data: {
        previousRank: entry.rank,
        teamScore: scored[i].teamScore,
        rank: ranks[i].rank,
      },
    });
  }
}
