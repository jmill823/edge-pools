import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateMockWinProbability } from "@/lib/scoring/mock-win-probability";
import { calculateMockCutProbability } from "@/lib/scoring/mock-cut-probability";

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
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  // Check membership
  if (pool.members.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Fetch all entries with picks and golfer scores
  const entries = await prisma.entry.findMany({
    where: { poolId: pool.id },
    include: {
      user: { select: { id: true, displayName: true } },
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

  // Get latest golfer scores for this tournament
  const golferIds = Array.from(
    new Set(entries.flatMap((e) => e.picks.map((p) => p.golferId)))
  );

  const golferScores = await prisma.golferScore.findMany({
    where: {
      golferId: { in: golferIds },
      tournamentId: pool.tournamentId,
    },
    orderBy: { round: "desc" },
    distinct: ["golferId"],
  });

  const scoreMap = new Map(
    golferScores.map((s) => [
      s.golferId,
      {
        totalScore: s.totalScore,
        position: s.position,
        holesCompleted: s.holesCompleted,
        round: s.round,
      },
    ])
  );

  // Count golfers currently on course
  const onCourse = golferScores.filter(
    (s) => s.holesCompleted > 0 && s.holesCompleted < 18 && s.position !== "CUT" && s.position !== "WD"
  ).length;

  // Check for pending replacements
  const pendingReplacements = await prisma.pendingReplacement.count({
    where: { poolId: pool.id, status: "PENDING" },
  });

  const isScored = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);

  // Format leaderboard
  const leaderboard = entries.map((entry) => {
    const sortedPicks = entry.picks
      .sort((a, b) => a.category.sortOrder - b.category.sortOrder)
      .map((pick) => {
        const score = scoreMap.get(pick.golferId);
        return {
          golferId: pick.golfer.id,
          categoryName: pick.category.name,
          golferName: pick.golfer.name,
          golferCountry: pick.golfer.country,
          golferScore: score?.totalScore ?? null,
          golferPosition: score?.position ?? null,
          holesCompleted: score?.holesCompleted ?? 0,
          round: score?.round ?? 0,
          isReplacement: pick.isReplacement,
          originalGolferName: pick.originalGolfer?.name ?? null,
        };
      });

    // Calculate mock probabilities (only when pool is scored)
    const winProbability = isScored
      ? calculateMockWinProbability(entry.teamScore, entry.rank, entries.length)
      : null;
    const cutProbability = isScored
      ? calculateMockCutProbability(
          sortedPicks.map((p) => ({ totalScore: p.golferScore, position: p.golferPosition }))
        )
      : null;

    return {
      id: entry.id,
      userId: entry.userId,
      displayName: entry.user.displayName,
      teamName: entry.teamName || entry.user.displayName,
      entryNumber: entry.entryNumber,
      teamScore: entry.teamScore,
      rank: entry.rank,
      previousRank: entry.previousRank,
      submittedAt: entry.submittedAt,
      isCurrentUser: entry.userId === user.id,
      winProbability,
      cutProbability,
      picks: sortedPicks,
    };
  });

  return NextResponse.json({
    pool: {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      maxEntries: pool.maxEntries,
      picksDeadline: pool.picksDeadline,
      inviteCode: pool.inviteCode,
    },
    tournament: {
      name: pool.tournament.name,
      status: pool.tournament.status,
      lastSyncAt: pool.tournament.lastSyncAt,
      currentRound: golferScores.length > 0
        ? Math.max(...golferScores.map((s) => s.round))
        : null,
    },
    onCourse,
    pendingReplacements,
    leaderboard,
  });
}
