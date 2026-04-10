import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestPlayer } from "@/lib/guest-auth";

/**
 * POST — Guest player submits a new entry with picks.
 * Body: { picks: [{ categoryId, golferId }], teamName: string }
 * Auth: guest cookie
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guestPlayer = await getGuestPlayer(params.id);
  if (!guestPlayer) {
    return NextResponse.json({ error: "Not authenticated as guest" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  // Deadline enforcement
  const now = new Date();
  if (now > pool.picksDeadline) {
    return NextResponse.json(
      { error: "Picks deadline has passed. Your picks are locked." },
      { status: 400 }
    );
  }

  if (pool.status !== "OPEN" && pool.status !== "SETUP") {
    return NextResponse.json({ error: "Pool is not accepting picks" }, { status: 400 });
  }

  const body = await req.json();
  const teamName: string | undefined = body.teamName;
  const picks: { categoryId: string; golferId: string }[] = body.picks;

  if (!teamName || typeof teamName !== "string" || teamName.trim().length === 0) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }
  if (teamName.trim().length > 30) {
    return NextResponse.json({ error: "Team name must be 30 characters or less" }, { status: 400 });
  }
  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json({ error: "Picks are required" }, { status: 400 });
  }

  // Validate all categories covered
  const categoryIds = pool.categories.map((c) => c.id);
  const pickedCategoryIds = picks.map((p) => p.categoryId);
  const missing = categoryIds.filter((id) => !pickedCategoryIds.includes(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: "All categories must have a pick" }, { status: 400 });
  }

  // No-reuse validation
  const golferIds = picks.map((p) => p.golferId);
  if (new Set(golferIds).size !== golferIds.length) {
    return NextResponse.json({ error: "Cannot pick the same golfer in multiple categories" }, { status: 400 });
  }

  // Entry number
  const existingEntries = await prisma.entry.count({
    where: { poolId: params.id, guestPlayerId: guestPlayer.id },
  });
  const entryNumber = existingEntries + 1;

  if (entryNumber > pool.maxEntries) {
    return NextResponse.json(
      { error: `Maximum of ${pool.maxEntries} entries allowed` },
      { status: 400 }
    );
  }

  const entry = await prisma.$transaction(async (tx) => {
    const newEntry = await tx.entry.create({
      data: {
        poolId: params.id,
        guestPlayerId: guestPlayer.id,
        entryNumber,
        teamName: teamName.trim(),
      },
    });

    await tx.pick.createMany({
      data: picks.map((p) => ({
        entryId: newEntry.id,
        categoryId: p.categoryId,
        golferId: p.golferId,
      })),
    });

    return newEntry;
  });

  return NextResponse.json(entry, { status: 201 });
}
