import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculatePoolStandings } from "@/lib/scoring/poll-scores";

// GET: Return golfers with current scores for manual entry
export async function GET(
  _req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.tournamentId },
  });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const golfers = await prisma.golfer.findMany({
    orderBy: [{ owgr: "asc" }, { name: "asc" }],
    select: { id: true, name: true, country: true, owgr: true },
  });

  const scores = await prisma.golferScore.findMany({
    where: { tournamentId: params.tournamentId },
    orderBy: { round: "desc" },
    distinct: ["golferId"],
  });

  const scoreMap = new Map(scores.map((s) => [s.golferId, s]));

  const result = golfers.map((g) => ({
    ...g,
    currentScore: scoreMap.get(g.id) ?? null,
  }));

  return NextResponse.json({
    tournament,
    golfers: result,
  });
}

// POST: Bulk update scores manually
export async function POST(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scores } = await req.json() as {
    scores: Array<{
      golferId: string;
      round: number;
      totalScore: number;
      position?: string;
    }>;
  };

  if (!Array.isArray(scores)) {
    return NextResponse.json({ error: "scores array required" }, { status: 400 });
  }

  for (const s of scores) {
    await prisma.golferScore.upsert({
      where: {
        golferId_tournamentId_round: {
          golferId: s.golferId,
          tournamentId: params.tournamentId,
          round: s.round,
        },
      },
      update: {
        totalScore: s.totalScore,
        position: s.position ?? null,
        holesCompleted: 18,
      },
      create: {
        golferId: s.golferId,
        tournamentId: params.tournamentId,
        round: s.round,
        totalScore: s.totalScore,
        position: s.position ?? null,
        holesCompleted: 18,
      },
    });
  }

  // Update lastSyncAt
  await prisma.tournament.update({
    where: { id: params.tournamentId },
    data: { lastSyncAt: new Date() },
  });

  // Recalculate all pools for this tournament
  const pools = await prisma.pool.findMany({
    where: { tournamentId: params.tournamentId, status: { in: ["LIVE", "LOCKED"] } },
  });

  for (const pool of pools) {
    await recalculatePoolStandings(pool.id, params.tournamentId);
  }

  return NextResponse.json({ updated: scores.length });
}
