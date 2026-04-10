import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchScorecard } from "@/lib/scoring/slashgolf";

/**
 * GET /api/pools/[id]/scorecard?golferIds=46046,28237&round=1
 *
 * Fetches hole-by-hole scorecards from SlashGolf for the given golfers
 * in this pool's tournament. Requires pool membership. Only available
 * when pool is LIVE, COMPLETE, or ARCHIVED.
 *
 * Returns: { scorecards: Record<slashGolfId, { holes, roundComplete, currentHole, ... }> }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: { select: { slashGolfTournId: true, year: true } },
      members: { where: { userId: user.id }, select: { id: true } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.members.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  if (!["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status)) {
    return NextResponse.json({ error: "Scores not available yet" }, { status: 400 });
  }

  if (!pool.tournament.slashGolfTournId) {
    return NextResponse.json({ error: "Tournament not configured for live scoring" }, { status: 400 });
  }

  const url = new URL(req.url);
  const golferIdsParam = url.searchParams.get("golferIds");
  const roundParam = url.searchParams.get("round");

  if (!golferIdsParam || !roundParam) {
    return NextResponse.json({ error: "Missing golferIds or round parameter" }, { status: 400 });
  }

  const round = parseInt(roundParam, 10);
  if (isNaN(round) || round < 1 || round > 4) {
    return NextResponse.json({ error: "Invalid round (1-4)" }, { status: 400 });
  }

  // Look up slashGolfIds for the requested golfer IDs
  const golferIds = golferIdsParam.split(",").slice(0, 9); // max 9 golfers per entry
  const golfers = await prisma.golfer.findMany({
    where: { id: { in: golferIds } },
    select: { id: true, slashGolfId: true, name: true },
  });

  const scorecards: Record<
    string,
    {
      golferName: string;
      roundComplete: boolean;
      currentHole: number;
      currentRoundScore: string;
      totalShots: number;
      holes: Array<{ hole: number; score: number; par: number }>;
    } | null
  > = {};

  // Fetch scorecards in parallel (max 9 concurrent)
  const results = await Promise.allSettled(
    golfers
      .filter((g) => g.slashGolfId)
      .map(async (golfer) => {
        const data = await fetchScorecard(
          pool.tournament.slashGolfTournId!,
          pool.tournament.year,
          round,
          golfer.slashGolfId!
        );

        const card = data[0]; // API returns array, usually length 1
        if (!card || !card.holes) {
          scorecards[golfer.id] = null;
          return;
        }

        // Parse holes object (keyed "1".."18") into sorted array
        const holes = Object.entries(card.holes)
          .map(([, h]) => ({
            hole: parseInt(h.holeId.$numberInt, 10),
            score: parseInt(h.holeScore.$numberInt, 10),
            par: parseInt(h.par.$numberInt, 10),
          }))
          .sort((a, b) => a.hole - b.hole);

        scorecards[golfer.id] = {
          golferName: golfer.name,
          roundComplete: card.roundComplete,
          currentHole: parseInt(card.currentHole.$numberInt, 10),
          currentRoundScore: card.currentRoundScore,
          totalShots: parseInt(card.totalShots.$numberInt, 10),
          holes,
        };
      })
  );

  // Log any failures silently — partial data is OK
  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[Scorecard] fetch failed:", r.reason);
    }
  }

  // Golfers without slashGolfId get null
  for (const g of golfers) {
    if (!g.slashGolfId) {
      scorecards[g.id] = null;
    }
  }

  return NextResponse.json({ scorecards, round });
}
