import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      organizerId: true,
      entryFee: true,
      paymentInfo: true,
    },
  });

  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await prisma.entry.findMany({
    where: { poolId: params.id },
    include: {
      user: { select: { displayName: true, email: true } },
      guestPlayer: { select: { displayName: true, email: true } },
    },
    orderBy: [{ paymentStatus: "asc" }, { submittedAt: "asc" }],
  });

  const formatted = entries.map((e) => ({
    id: e.id,
    displayName: e.user?.displayName ?? e.guestPlayer?.displayName ?? "Unknown",
    email: e.user?.email ?? e.guestPlayer?.email ?? null,
    entryNumber: e.entryNumber,
    teamName: e.teamName,
    paymentStatus: e.paymentStatus,
  }));

  const paidCount = entries.filter((e) => e.paymentStatus === "paid").length;

  return NextResponse.json({
    entryFee: pool.entryFee,
    paymentInfo: pool.paymentInfo,
    totalEntries: entries.length,
    paidCount,
    entries: formatted,
  });
}
