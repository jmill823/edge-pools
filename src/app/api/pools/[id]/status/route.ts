import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SETUP: ["OPEN"],
  OPEN: ["LOCKED"],
  LOCKED: ["LIVE"],
  LIVE: ["COMPLETE"],
  COMPLETE: ["ARCHIVED"],
};

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

  const { status } = await req.json();
  const allowed = VALID_TRANSITIONS[pool.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${pool.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.pool.update({
    where: { id: params.id },
    data: { status },
  });

  // When pool goes LIVE, also set tournament to LIVE
  if (status === "LIVE") {
    await prisma.tournament.update({
      where: { id: pool.tournamentId },
      data: { status: "LIVE" },
    });
  }

  // When pool completes, check if all pools for tournament are complete
  if (status === "COMPLETE") {
    const activePools = await prisma.pool.count({
      where: {
        tournamentId: pool.tournamentId,
        status: { not: "COMPLETE" },
        id: { not: pool.id },
      },
    });
    if (activePools === 0) {
      await prisma.tournament.update({
        where: { id: pool.tournamentId },
        data: { status: "COMPLETE" },
      });
    }
  }

  return NextResponse.json(updated);
}
