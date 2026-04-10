import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestPlayer } from "@/lib/guest-auth";

/**
 * PATCH — Guest player edits picks for an existing entry.
 * Body: { picks: [{ categoryId, golferId }], teamName?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  const guestPlayer = await getGuestPlayer(params.id);
  if (!guestPlayer) {
    return NextResponse.json({ error: "Not authenticated as guest" }, { status: 401 });
  }

  const entry = await prisma.entry.findUnique({
    where: { id: params.entryId },
    include: { pool: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if (entry.poolId !== params.id) {
    return NextResponse.json({ error: "Entry does not belong to this pool" }, { status: 400 });
  }
  if (entry.guestPlayerId !== guestPlayer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (entry.pool.status !== "OPEN") {
    return NextResponse.json({ error: "Pool is not accepting pick edits" }, { status: 400 });
  }

  const now = new Date();
  if (now > entry.pool.picksDeadline) {
    return NextResponse.json(
      { error: "Picks deadline has passed. Your picks are locked." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const teamName: string | undefined = body.teamName;
  const picks: { categoryId: string; golferId: string }[] = body.picks;

  if (teamName !== undefined) {
    if (typeof teamName !== "string" || teamName.trim().length === 0) {
      return NextResponse.json({ error: "Team name cannot be empty" }, { status: 400 });
    }
    if (teamName.trim().length > 30) {
      return NextResponse.json({ error: "Team name must be 30 characters or less" }, { status: 400 });
    }
  }

  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json({ error: "Picks are required" }, { status: 400 });
  }

  const golferIds = picks.map((p) => p.golferId);
  if (new Set(golferIds).size !== golferIds.length) {
    return NextResponse.json({ error: "Cannot pick the same golfer in multiple categories" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.pick.deleteMany({ where: { entryId: params.entryId } });
    await tx.pick.createMany({
      data: picks.map((p) => ({
        entryId: params.entryId,
        categoryId: p.categoryId,
        golferId: p.golferId,
      })),
    });
    await tx.entry.update({
      where: { id: params.entryId },
      data: {
        updatedAt: new Date(),
        ...(teamName !== undefined ? { teamName: teamName.trim() } : {}),
      },
    });
  });

  return NextResponse.json({ success: true });
}
