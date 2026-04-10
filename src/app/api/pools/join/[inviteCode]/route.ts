import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { inviteCode: string } }
) {
  const pool = await prisma.pool.findUnique({
    where: { inviteCode: params.inviteCode },
    include: {
      tournament: true,
      organizer: { select: { displayName: true } },
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { golfers: true } } },
      },
      _count: { select: { members: true, guestPlayers: true } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: pool.id,
    name: pool.name,
    tournamentName: pool.tournament.name,
    tournamentCourse: pool.tournament.course,
    organizerName: pool.organizer.displayName,
    categoryCount: pool.categories.length,
    categories: pool.categories.map((c) => ({
      name: c.name,
      golferCount: c._count.golfers,
    })),
    memberCount: pool._count.members + pool._count.guestPlayers,
    maxEntries: pool.maxEntries,
    picksDeadline: pool.picksDeadline,
    acceptingMembers: pool.acceptingMembers,
    status: pool.status,
    rules: pool.rules,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: { inviteCode: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { inviteCode: params.inviteCode },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.status !== "OPEN") {
    return NextResponse.json(
      { error: "This pool is not currently accepting players" },
      { status: 400 }
    );
  }

  if (!pool.acceptingMembers) {
    return NextResponse.json(
      { error: "This pool is no longer accepting new members" },
      { status: 400 }
    );
  }

  // Check if already a member
  const existing = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({
      alreadyMember: true,
      poolId: pool.id,
    });
  }

  await prisma.poolMember.create({
    data: {
      poolId: pool.id,
      userId: user.id,
      role: "PLAYER",
    },
  });

  return NextResponse.json({ poolId: pool.id, joined: true });
}
