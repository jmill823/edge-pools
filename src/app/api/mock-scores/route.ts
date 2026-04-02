import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculatePoolStandings } from "@/lib/scoring/poll-scores";

/**
 * POST /api/mock-scores — Inject mock scores for testing.
 * Body: { tournamentId, scores: [{ golferName, round, holesCompleted, roundScore, totalScore, position }] }
 */
export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tournamentId, scores } = body;

  if (!tournamentId || !Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ error: "tournamentId and scores array required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const score of scores) {
    const golfer = await prisma.golfer.findFirst({
      where: { name: { contains: score.golferName, mode: "insensitive" } },
    });

    if (!golfer) {
      errors.push(`Golfer not found: ${score.golferName}`);
      continue;
    }

    await prisma.golferScore.upsert({
      where: {
        golferId_tournamentId_round: {
          golferId: golfer.id,
          tournamentId,
          round: score.round || 1,
        },
      },
      update: {
        holesCompleted: score.holesCompleted ?? 18,
        roundScore: score.roundScore ?? score.totalScore ?? 0,
        totalScore: score.totalScore ?? 0,
        position: score.position ?? null,
      },
      create: {
        golferId: golfer.id,
        tournamentId,
        round: score.round || 1,
        holesCompleted: score.holesCompleted ?? 18,
        roundScore: score.roundScore ?? score.totalScore ?? 0,
        totalScore: score.totalScore ?? 0,
        position: score.position ?? null,
      },
    });
    updated++;
  }

  // Update lastSyncAt
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { lastSyncAt: new Date() },
  });

  // Recalculate standings for all pools using this tournament
  const pools = await prisma.pool.findMany({
    where: { tournamentId },
    select: { id: true },
  });

  for (const pool of pools) {
    await recalculatePoolStandings(pool.id, tournamentId);
  }

  return NextResponse.json({
    scoresUpdated: updated,
    poolsRecalculated: pools.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
