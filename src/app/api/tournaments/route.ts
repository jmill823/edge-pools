import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["UPCOMING", "LIVE"] } },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(tournaments);
}
