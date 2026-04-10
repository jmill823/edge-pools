import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setGuestPlayerCookie } from "@/lib/guest-auth";

/**
 * POST — Guest player joins a pool.
 * Body: { displayName: string, email: string }
 *
 * If email already exists in this pool, returns existing guest player (return visit).
 * Otherwise creates a new guest player record.
 * Sets a cookie for subsequent guest requests.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.status !== "OPEN") {
    return NextResponse.json(
      { error: "This pool is not currently accepting players" },
      { status: 400 }
    );
  }

  if (!pool.acceptingMembers) {
    return NextResponse.json(
      { error: "This pool is no longer accepting new members" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const displayName = body.displayName?.trim();
  const email = body.email?.trim()?.toLowerCase();

  if (!displayName || typeof displayName !== "string" || displayName.length === 0) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }
  if (displayName.length > 50) {
    return NextResponse.json({ error: "Display name must be 50 characters or less" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  // Check for existing guest player
  const existing = await prisma.guestPlayer.findUnique({
    where: { poolId_email: { poolId: pool.id, email } },
  });

  if (existing) {
    // Return visit — update display name if different, set cookie
    if (existing.displayName !== displayName) {
      await prisma.guestPlayer.update({
        where: { id: existing.id },
        data: { displayName },
      });
    }

    setGuestPlayerCookie(pool.id, existing.id);

    // Check if they have entries
    const entryCount = await prisma.entry.count({
      where: { guestPlayerId: existing.id },
    });

    return NextResponse.json({
      guestPlayerId: existing.id,
      poolId: pool.id,
      returning: true,
      displayName,
      hasEntries: entryCount > 0,
    });
  }

  // New guest player
  const guestPlayer = await prisma.guestPlayer.create({
    data: {
      poolId: pool.id,
      displayName,
      email,
    },
  });

  setGuestPlayerCookie(pool.id, guestPlayer.id);

  return NextResponse.json({
    guestPlayerId: guestPlayer.id,
    poolId: pool.id,
    returning: false,
    displayName,
    hasEntries: false,
  }, { status: 201 });
}
