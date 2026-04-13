import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { ManagePanel } from "./_components/ManagePanel";

export default async function ManagePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: {
        select: { id: true, name: true, startDate: true, endDate: true, course: true, lastSyncAt: true },
      },
      _count: { select: { members: true, entries: true, categories: true } },
    },
  });

  if (!pool) redirect("/dashboard");

  // Organizer-only page
  const isOrganizer = pool.organizerId === user.id;
  if (!isOrganizer) redirect(`/pool/${pool.id}`);

  // Fetch members with their roles
  const members = await prisma.poolMember.findMany({
    where: { poolId: pool.id },
    include: { user: { select: { displayName: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  // Fetch ALL entries for this pool with pick counts
  const entries = await prisma.entry.findMany({
    where: { poolId: pool.id },
    include: {
      guestPlayer: { select: { displayName: true, email: true } },
      _count: { select: { picks: true } },
    },
  });

  // Build member data with entry counts and pick completeness
  const categoryCount = pool._count.categories;
  const memberEntries = new Map<string, { count: number; completePicks: number }>();
  for (const entry of entries) {
    if (!entry.userId) continue;
    const existing = memberEntries.get(entry.userId) || { count: 0, completePicks: 0 };
    existing.count += 1;
    if (entry._count.picks >= categoryCount) {
      existing.completePicks += 1;
    }
    memberEntries.set(entry.userId, existing);
  }

  // Guest entries: entries with guestPlayerId but no userId
  const guestEntries = entries.filter((e) => e.guestPlayerId && !e.userId);

  const pendingReplacements = await prisma.pendingReplacement.count({
    where: { poolId: pool.id, status: "PENDING" },
  });

  // Winner name for COMPLETE status
  let winnerName: string | null = null;
  if (pool.status === "COMPLETE" || pool.status === "ARCHIVED") {
    const topEntry = await prisma.entry.findFirst({
      where: { poolId: pool.id, rank: 1 },
      include: { guestPlayer: { select: { displayName: true } } },
    });
    if (topEntry) {
      if (topEntry.userId) {
        const topUser = members.find((m) => m.userId === topEntry.userId);
        winnerName = topEntry.teamName || topUser?.user.displayName || "Unknown";
      } else if (topEntry.guestPlayer) {
        winnerName = topEntry.teamName || topEntry.guestPlayer.displayName;
      }
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    console.warn("[TILT] NEXT_PUBLIC_APP_URL is not set — invite links will use a relative path.");
  }
  const inviteUrl = `${baseUrl || ""}/join/${pool.inviteCode}`;

  // Total entries including guests
  const totalEntries = pool._count.entries;
  const paidEntries = entries.filter((e) => e.paymentStatus === "paid").length;

  return (
    <ManagePanel
      pool={{
        id: pool.id,
        name: pool.name,
        status: pool.status,
        acceptingMembers: pool.acceptingMembers,
        inviteCode: pool.inviteCode,
        maxEntries: pool.maxEntries,
        picksDeadline: pool.picksDeadline.toISOString(),
        categoryCount,
        tournamentId: pool.tournament.id,
        tournament: {
          name: pool.tournament.name,
          startDate: pool.tournament.startDate.toISOString(),
          endDate: pool.tournament.endDate.toISOString(),
          course: pool.tournament.course,
        },
        memberCount: pool._count.members,
        totalEntries,
        paidEntries,
        lastSyncAt: pool.tournament.lastSyncAt?.toISOString() ?? null,
        pendingReplacements,
        winnerName,
      }}
      members={members.map((m) => {
        const entryData = memberEntries.get(m.userId) || { count: 0, completePicks: 0 };
        return {
          id: m.id,
          userId: m.userId,
          displayName: m.user.displayName,
          email: m.user.email,
          role: m.role,
          hasPaid: m.hasPaid,
          entryCount: entryData.count,
          completePicks: entryData.completePicks,
          isGuest: false,
        };
      })}
      guestMembers={guestEntries.map((e) => ({
        entryId: e.id,
        displayName: e.guestPlayer?.displayName || e.teamName || "Guest",
        email: e.guestPlayer?.email || null,
        paymentStatus: e.paymentStatus,
        entryCount: 1,
        completePicks: e._count.picks >= categoryCount ? 1 : 0,
        isGuest: true,
      }))}
      inviteUrl={inviteUrl}
    />
  );
}
