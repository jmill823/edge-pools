import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestPlayer } from "@/lib/guest-auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guestPlayer = await getGuestPlayer(params.id);
  if (!guestPlayer) {
    return NextResponse.json({ error: "Not authenticated as guest" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          golfers: { include: { golfer: true } },
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const categories = pool.categories.map((c) => ({
    id: c.id,
    name: c.name,
    qualifier: c.qualifier,
    sortOrder: c.sortOrder,
    golfers: c.golfers.map((cg) => ({
      id: cg.golfer.id,
      name: cg.golfer.name,
      country: cg.golfer.country,
      owgr: cg.golfer.owgr,
    })),
  }));

  return NextResponse.json(categories);
}
