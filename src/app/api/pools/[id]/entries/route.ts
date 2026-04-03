import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET — Return entries.
 *   Organizer (after deadline): all entries with picks.
 *   Member: own entries only (redirects to /mine).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: { tournament: true },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  // Only organizer can view all entries, and only after deadline
  if (pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  if (now < pool.picksDeadline) {
    return NextResponse.json(
      { error: "Entries are not visible until after the picks deadline" },
      { status: 403 }
    );
  }

  const entries = await prisma.entry.findMany({
    where: { poolId: params.id },
    include: {
      user: { select: { displayName: true, email: true } },
      picks: {
        include: {
          golfer: { select: { name: true, country: true, owgr: true } },
          category: { select: { name: true, sortOrder: true } },
        },
        orderBy: { category: { sortOrder: "asc" } },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  const memberCount = await prisma.poolMember.count({
    where: { poolId: params.id },
  });

  return NextResponse.json({
    entries,
    memberCount,
    entryCount: entries.length,
  });
}

/**
 * POST — Submit new entry with picks.
 * Body: { picks: [{ categoryId, golferId }], entryNumber? }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  // Check membership
  const membership = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: params.id, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a pool member" }, { status: 403 });
  }

  // Deadline enforcement
  const now = new Date();
  if (now > pool.picksDeadline) {
    return NextResponse.json(
      { error: "Picks deadline has passed. Your picks are locked." },
      { status: 400 }
    );
  }

  // Pool must be OPEN
  if (pool.status !== "OPEN" && pool.status !== "SETUP") {
    return NextResponse.json(
      { error: "Pool is not accepting picks" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const teamName: string | undefined = body.teamName;
  const picks: { categoryId: string; golferId: string }[] = body.picks;

  // teamName is required
  if (!teamName || typeof teamName !== "string" || teamName.trim().length === 0) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 }
    );
  }
  if (teamName.trim().length > 30) {
    return NextResponse.json(
      { error: "Team name must be 30 characters or less" },
      { status: 400 }
    );
  }

  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json(
      { error: "Picks are required" },
      { status: 400 }
    );
  }

  // Validate all categories have a pick
  const categoryIds = pool.categories.map((c) => c.id);
  const pickedCategoryIds = picks.map((p) => p.categoryId);
  const missingCategories = categoryIds.filter(
    (id) => !pickedCategoryIds.includes(id)
  );
  if (missingCategories.length > 0) {
    return NextResponse.json(
      { error: "All categories must have a pick" },
      { status: 400 }
    );
  }

  // No-reuse validation: no duplicate golferIds within this entry
  const golferIds = picks.map((p) => p.golferId);
  const uniqueGolferIds = new Set(golferIds);
  if (uniqueGolferIds.size !== golferIds.length) {
    return NextResponse.json(
      { error: "Cannot pick the same golfer in multiple categories" },
      { status: 400 }
    );
  }

  // Determine entry number
  const existingEntries = await prisma.entry.count({
    where: { poolId: params.id, userId: user.id },
  });
  const entryNumber = existingEntries + 1;

  if (entryNumber > pool.maxEntries) {
    return NextResponse.json(
      { error: `Maximum of ${pool.maxEntries} entries allowed` },
      { status: 400 }
    );
  }

  // Create entry + picks in transaction
  const entry = await prisma.$transaction(async (tx) => {
    const newEntry = await tx.entry.create({
      data: {
        poolId: params.id,
        userId: user.id,
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
