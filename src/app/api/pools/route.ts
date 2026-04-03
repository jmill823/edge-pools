import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { generateUniqueInviteCode } from "@/lib/invite-code";

interface CategoryInput {
  name: string;
  sortOrder: number;
  golferIds: string[];
}

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pools = await prisma.pool.findMany({
    where: {
      OR: [
        { organizerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      tournament: true,
      _count: { select: { members: true, entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get user's entries to determine pick status + best rank/score
  const entries = await prisma.entry.findMany({
    where: { userId: user.id, poolId: { in: pools.map((p) => p.id) } },
    select: { poolId: true, rank: true, teamScore: true },
    orderBy: { rank: "asc" },
  });
  const poolsWithPicks = new Set(entries.map((e) => e.poolId));

  // Best entry per pool (lowest rank)
  const bestEntry = new Map<string, { rank: number | null; teamScore: number | null }>();
  for (const e of entries) {
    if (!bestEntry.has(e.poolId)) {
      bestEntry.set(e.poolId, { rank: e.rank, teamScore: e.teamScore });
    }
  }

  const result = pools.map((p) => ({
    ...p,
    memberCount: p._count.members,
    entryCount: p._count.entries,
    hasSubmittedPicks: poolsWithPicks.has(p.id),
    isOrganizer: p.organizerId === user.id,
    myBestRank: bestEntry.get(p.id)?.rank ?? null,
    myBestScore: bestEntry.get(p.id)?.teamScore ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    tournamentId,
    categories,
    picksDeadline,
    maxEntries,
    rules,
  }: {
    name: string;
    tournamentId: string;
    categories: CategoryInput[];
    picksDeadline: string;
    maxEntries: number;
    rules?: string;
  } = body;

  if (!name || !tournamentId || !categories?.length || !picksDeadline) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  const inviteCode = await generateUniqueInviteCode();

  const pool = await prisma.pool.create({
    data: {
      name,
      organizerId: user.id,
      tournamentId,
      inviteCode,
      picksDeadline: new Date(picksDeadline),
      maxEntries: maxEntries || 1,
      rules: rules || null,
      status: "SETUP",
      categories: {
        create: categories.map((cat) => ({
          name: cat.name,
          sortOrder: cat.sortOrder,
          golfers: {
            create: cat.golferIds.map((golferId) => ({ golferId })),
          },
        })),
      },
      members: {
        create: {
          userId: user.id,
          role: "ORGANIZER",
        },
      },
    },
  });

  return NextResponse.json({ id: pool.id, inviteCode: pool.inviteCode });
}
