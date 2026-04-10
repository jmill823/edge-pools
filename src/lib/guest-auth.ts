import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const GUEST_COOKIE_PREFIX = "guest_pool_";

/**
 * Get the guest player ID for a specific pool from cookies.
 * Cookie name: guest_pool_{poolId}
 * Cookie value: guestPlayerId
 */
export function getGuestPlayerIdFromCookie(poolId: string): string | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get(`${GUEST_COOKIE_PREFIX}${poolId}`);
  return cookie?.value ?? null;
}

/**
 * Set the guest player cookie for a pool.
 * HttpOnly, SameSite=Lax, path=/, 90-day expiry.
 */
export function setGuestPlayerCookie(poolId: string, guestPlayerId: string) {
  const cookieStore = cookies();
  cookieStore.set(`${GUEST_COOKIE_PREFIX}${poolId}`, guestPlayerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Look up the guest player from cookie for a given pool.
 * Returns the GuestPlayer record or null.
 */
export async function getGuestPlayer(poolId: string) {
  const guestPlayerId = getGuestPlayerIdFromCookie(poolId);
  if (!guestPlayerId) return null;

  return prisma.guestPlayer.findUnique({
    where: { id: guestPlayerId },
  });
}

/**
 * Get guest player or authenticated user for a pool.
 * Returns { type: "guest", guestPlayer } or { type: "user", user } or null.
 */
export async function getGuestOrUser(poolId: string) {
  // First try Clerk auth
  const { getOrCreateUser } = await import("@/lib/auth");
  const user = await getOrCreateUser();
  if (user) return { type: "user" as const, user, guestPlayer: null };

  // Fall back to guest cookie
  const guestPlayer = await getGuestPlayer(poolId);
  if (guestPlayer) return { type: "guest" as const, user: null, guestPlayer };

  return null;
}
