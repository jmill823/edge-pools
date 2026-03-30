import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { poolId: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await prisma.pool.findUnique({
    where: { id: params.poolId },
  });

  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const replacements = await prisma.pendingReplacement.findMany({
    where: { poolId: params.poolId },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with golfer + pick + entry details
  const enriched = await Promise.all(
    replacements.map(async (r) => {
      const [originalGolfer, replacementGolfer, pick] = await Promise.all([
        prisma.golfer.findUnique({ where: { id: r.originalGolferId }, select: { name: true, country: true } }),
        r.replacementGolferId
          ? prisma.golfer.findUnique({ where: { id: r.replacementGolferId }, select: { name: true, country: true } })
          : null,
        prisma.pick.findUnique({
          where: { id: r.pickId },
          include: {
            entry: { include: { user: { select: { displayName: true } } } },
            category: { select: { name: true } },
          },
        }),
      ]);

      // Get replacement golfer's current score
      let replacementScore = null;
      if (r.replacementGolferId) {
        const score = await prisma.golferScore.findFirst({
          where: { golferId: r.replacementGolferId, tournamentId: pool.tournamentId },
          orderBy: { round: "desc" },
        });
        replacementScore = score?.totalScore ?? null;
      }

      return {
        ...r,
        originalGolferName: originalGolfer?.name ?? "Unknown",
        replacementGolferName: replacementGolfer?.name ?? "No replacement available",
        replacementScore,
        playerName: pick?.entry?.user?.displayName ?? "Unknown",
        entryNumber: pick?.entry?.entryNumber ?? 1,
        categoryName: pick?.category?.name ?? "Unknown",
      };
    })
  );

  return NextResponse.json(enriched);
}
