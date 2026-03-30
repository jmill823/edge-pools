import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculatePoolStandings } from "@/lib/scoring/poll-scores";

export async function POST(
  req: NextRequest,
  { params }: { params: { poolId: string; id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await prisma.pool.findUnique({ where: { id: params.poolId } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { replacementGolferId } = await req.json();
  if (!replacementGolferId) {
    return NextResponse.json({ error: "replacementGolferId required" }, { status: 400 });
  }

  const replacement = await prisma.pendingReplacement.findUnique({
    where: { id: params.id },
  });

  if (!replacement || replacement.poolId !== params.poolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (replacement.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }

  // Execute the override replacement
  await prisma.$transaction([
    prisma.pick.update({
      where: { id: replacement.pickId },
      data: {
        golferId: replacementGolferId,
        isReplacement: true,
        originalGolferId: replacement.originalGolferId,
      },
    }),
    prisma.pendingReplacement.update({
      where: { id: params.id },
      data: {
        status: "OVERRIDDEN",
        replacementGolferId,
        confirmedAt: new Date(),
      },
    }),
  ]);

  await recalculatePoolStandings(params.poolId, pool.tournamentId);

  return NextResponse.json({ success: true });
}
