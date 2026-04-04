import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pollAllLiveTournaments } from "@/lib/scoring/poll-scores";

/**
 * Manual score poll trigger — organizer-only.
 * Unlike the cron endpoint (which uses CRON_SECRET), this uses auth + organizer check.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pool.status !== "LIVE") {
    return NextResponse.json({ error: "Pool must be LIVE to poll scores" }, { status: 400 });
  }

  try {
    const results = await pollAllLiveTournaments();
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Manual poll error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Score update failed" },
      { status: 500 }
    );
  }
}
