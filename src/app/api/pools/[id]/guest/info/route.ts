import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestPlayer } from "@/lib/guest-auth";

/**
 * GET — Return basic pool info for guest players.
 */
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
      tournament: { select: { name: true, course: true } },
      organizer: { select: { displayName: true } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: pool.id,
    name: pool.name,
    status: pool.status,
    picksDeadline: pool.picksDeadline,
    maxEntries: pool.maxEntries,
    inviteCode: pool.inviteCode,
    tournamentName: pool.tournament.name,
    organizerName: pool.organizer.displayName,
  });
}
