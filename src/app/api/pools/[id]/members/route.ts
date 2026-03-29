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

  const pool = await prisma.pool.findUnique({ where: { id: params.id } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.poolMember.findMany({
    where: { poolId: params.id },
    include: {
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  // Get entry counts per user
  const entries = await prisma.entry.groupBy({
    by: ["userId"],
    where: { poolId: params.id },
    _count: true,
  });
  const entryCountMap = new Map(
    entries.map((e) => [e.userId, e._count])
  );

  const result = members.map((m) => ({
    id: m.id,
    displayName: m.user.displayName,
    email: m.user.email,
    role: m.role,
    hasPaid: m.hasPaid,
    joinedAt: m.joinedAt,
    entriesSubmitted: entryCountMap.get(m.userId) || 0,
  }));

  return NextResponse.json(result);
}
