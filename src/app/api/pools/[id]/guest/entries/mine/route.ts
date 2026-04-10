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

  const entries = await prisma.entry.findMany({
    where: { poolId: params.id, guestPlayerId: guestPlayer.id },
    include: {
      picks: {
        include: {
          golfer: { select: { id: true, name: true, country: true, owgr: true } },
          category: { select: { id: true, name: true, sortOrder: true } },
        },
        orderBy: { category: { sortOrder: "asc" } },
      },
    },
    orderBy: { entryNumber: "asc" },
  });

  return NextResponse.json(entries);
}
