import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

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
    include: {
      tournament: true,
      organizer: { select: { displayName: true } },
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          golfers: {
            include: { golfer: true },
          },
        },
      },
      _count: { select: { members: true, entries: true } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const pendingReplacements = await prisma.pendingReplacement.count({
    where: { poolId: pool.id, status: "PENDING" },
  });

  return NextResponse.json({
    ...pool,
    memberCount: pool._count.members,
    entryCount: pool._count.entries,
    isOrganizer: pool.organizerId === user.id,
    pendingReplacements,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({ where: { id: params.id } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed: Record<string, unknown> = {};

  // acceptingMembers can be toggled in SETUP and OPEN
  if (body.acceptingMembers !== undefined) {
    if (!["SETUP", "OPEN"].includes(pool.status)) {
      return NextResponse.json(
        { error: "Cannot change accepting members after pool is locked" },
        { status: 400 }
      );
    }
    allowed.acceptingMembers = body.acceptingMembers;
  }

  // Pool settings only editable in SETUP
  const settingsFields = ["name", "picksDeadline", "maxEntries", "rules", "missedCutPenalty", "scoringMode", "bestX", "bestY", "tiebreaker"];
  const hasSettings = settingsFields.some((f) => body[f] !== undefined);
  if (hasSettings && pool.status !== "SETUP") {
    return NextResponse.json(
      { error: "Pool settings can only be edited during SETUP" },
      { status: 400 }
    );
  }

  // Payment settings can be updated in any non-archived status
  if (body.entryFee !== undefined) allowed.entryFee = body.entryFee;
  if (body.paymentInfo !== undefined) allowed.paymentInfo = body.paymentInfo;

  if (body.name !== undefined) allowed.name = body.name;
  if (body.picksDeadline !== undefined)
    allowed.picksDeadline = new Date(body.picksDeadline);
  if (body.maxEntries !== undefined) allowed.maxEntries = body.maxEntries;
  if (body.rules !== undefined) allowed.rules = body.rules;
  if (body.missedCutPenalty !== undefined) allowed.missedCutPenalty = body.missedCutPenalty;
  if (body.scoringMode !== undefined) allowed.scoringMode = body.scoringMode;
  if (body.bestX !== undefined) allowed.bestX = body.bestX;
  if (body.bestY !== undefined) allowed.bestY = body.bestY;
  if (body.tiebreaker !== undefined) allowed.tiebreaker = body.tiebreaker;

  const updated = await prisma.pool.update({
    where: { id: params.id },
    data: allowed,
  });

  return NextResponse.json(updated);
}
