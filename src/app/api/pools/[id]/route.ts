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

  return NextResponse.json({
    ...pool,
    memberCount: pool._count.members,
    entryCount: pool._count.entries,
    isOrganizer: pool.organizerId === user.id,
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

  if (body.name !== undefined) allowed.name = body.name;
  if (body.picksDeadline !== undefined)
    allowed.picksDeadline = new Date(body.picksDeadline);
  if (body.maxEntries !== undefined) allowed.maxEntries = body.maxEntries;
  if (body.rules !== undefined) allowed.rules = body.rules;
  if (body.acceptingMembers !== undefined)
    allowed.acceptingMembers = body.acceptingMembers;

  const updated = await prisma.pool.update({
    where: { id: params.id },
    data: allowed,
  });

  return NextResponse.json(updated);
}
