import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculatePoolStandings } from "@/lib/scoring/poll-scores";

/**
 * POST /api/mock-scores/random — Generate random plausible scores for all picked golfers.
 * Body: { tournamentId }
 */
export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tournamentId } = body;

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Find all golfers that are picked in any entry for pools using this tournament
  const picks = await prisma.pick.findMany({
    where: { entry: { pool: { tournamentId } } },
    select: { golferId: true },
    distinct: ["golferId"],
  });

  const golferIds = picks.map((p) => p.golferId);

  if (golferIds.length === 0) {
    return NextResponse.json({ error: "No picks found for this tournament" }, { status: 400 });
  }

  // Generate plausible golf scores: totalScore between -10 and +6
  let updated = 0;
  for (const golferId of golferIds) {
    const totalScore = Math.floor(Math.random() * 17) - 10; // -10 to +6
    const roundScore = Math.floor(Math.random() * 11) - 5; // -5 to +5
    const position = totalScore <= 0
      ? `${totalScore === 0 ? "E" : totalScore}`
      : `+${totalScore}`;

    await prisma.golferScore.upsert({
      where: {
        golferId_tournamentId_round: {
          golferId,
          tournamentId,
          round: 1,
        },
      },
      update: {
        holesCompleted: 18,
        roundScore,
        totalScore,
        position,
      },
      create: {
        golferId,
        tournamentId,
        round: 1,
        holesCompleted: 18,
        roundScore,
        totalScore,
        position,
      },
    });
    updated++;
  }

  // Update lastSyncAt
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { lastSyncAt: new Date() },
  });

  // Recalculate standings for all pools
  const pools = await prisma.pool.findMany({
    where: { tournamentId },
    select: { id: true },
  });

  for (const pool of pools) {
    await recalculatePoolStandings(pool.id, tournamentId);
  }

  return NextResponse.json({
    golfersScored: updated,
    poolsRecalculated: pools.length,
  });
}
