import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET eligible replacement golfers for a pending replacement.
 * Returns golfers in the same category that are:
 * - Not already picked in the affected entry
 * - Not WD/CUT themselves
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { poolId: string; id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await prisma.pool.findUnique({ where: { id: params.poolId } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const replacement = await prisma.pendingReplacement.findUnique({
    where: { id: params.id },
  });

  if (!replacement || replacement.poolId !== params.poolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pick = await prisma.pick.findUnique({
    where: { id: replacement.pickId },
    include: {
      category: { include: { golfers: { include: { golfer: true } } } },
    },
  });

  if (!pick) {
    return NextResponse.json({ error: "Pick not found" }, { status: 404 });
  }

  // Get all golfer IDs already in this entry
  const entryPicks = await prisma.pick.findMany({
    where: { entryId: pick.entryId },
    select: { golferId: true },
  });
  const pickedIds = new Set(entryPicks.map((p) => p.golferId));

  // Get WD/CUT golfer IDs
  const wdCutScores = await prisma.golferScore.findMany({
    where: {
      tournamentId: pool.tournamentId,
      position: { in: ["CUT", "WD"] },
    },
    select: { golferId: true },
    distinct: ["golferId"],
  });
  const wdCutIds = new Set(wdCutScores.map((s) => s.golferId));

  // Filter eligible
  const eligible = pick.category.golfers
    .filter((cg) =>
      !pickedIds.has(cg.golferId) &&
      !wdCutIds.has(cg.golferId) &&
      cg.golferId !== replacement.originalGolferId
    )
    .map((cg) => cg.golfer);

  // Get scores for eligible golfers
  const scores = await prisma.golferScore.findMany({
    where: {
      golferId: { in: eligible.map((g) => g.id) },
      tournamentId: pool.tournamentId,
    },
    orderBy: { round: "desc" },
    distinct: ["golferId"],
  });
  const scoreMap = new Map(scores.map((s) => [s.golferId, s.totalScore]));

  const result = eligible
    .map((g) => ({
      id: g.id,
      name: g.name,
      score: scoreMap.get(g.id) ?? null,
    }))
    .sort((a, b) => {
      // Sort by score descending (worst first, matching the replacement logic)
      const sa = a.score ?? 0;
      const sb = b.score ?? 0;
      return sb - sa;
    });

  return NextResponse.json(result);
}
