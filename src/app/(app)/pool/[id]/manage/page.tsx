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
  if (!isOrganizer) redirect(`/pool/${pool.id}/leaderboard`);

  const members = await prisma.poolMember.findMany({
    where: { poolId: pool.id },
    include: { user: { select: { displayName: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const entries = await prisma.entry.groupBy({
    by: ["userId"],
    where: { poolId: pool.id },
    _count: true,
  });
  const entryCountMap = new Map(entries.map((e) => [e.userId, e._count]));

  const pendingReplacements = await prisma.pendingReplacement.count({
    where: { poolId: pool.id, status: "PENDING" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    console.warn("[TILT] NEXT_PUBLIC_APP_URL is not set — invite links will use a relative path. Set this env var in Vercel project settings.");
  }
  const inviteUrl = `${baseUrl || ""}/join/${pool.inviteCode}`;

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
        rules: pool.rules,
        missedCutPenalty: pool.missedCutPenalty,
        scoringMode: pool.scoringMode,
        bestX: pool.bestX,
        bestY: pool.bestY,
        tiebreaker: pool.tiebreaker,
        scoringType: (pool as Record<string, unknown>).scoringType as string ?? "to-par",
        missedCutPenaltyType: (pool as Record<string, unknown>).missedCutPenaltyType as string ?? "carry-score",
        missedCutFixedPenalty: (pool as Record<string, unknown>).missedCutFixedPenalty as number | null ?? 4,
        tiebreakerRule: (pool as Record<string, unknown>).tiebreakerRule as string ?? "entry-timestamp",
        rosterRule: (pool as Record<string, unknown>).rosterRule as string ?? "all-play",
        rosterRuleMode: (pool as Record<string, unknown>).rosterRuleMode as string ?? "per-tournament",
        rosterRuleCount: (pool as Record<string, unknown>).rosterRuleCount as number | null ?? null,
        categoryCount: pool._count.categories,
        tournamentId: pool.tournament.id,
        tournament: {
          name: pool.tournament.name,
          startDate: pool.tournament.startDate.toISOString(),
          endDate: pool.tournament.endDate.toISOString(),
          course: pool.tournament.course,
        },
        memberCount: pool._count.members,
        entryCount: pool._count.entries,
        entryFee: pool.entryFee ?? null,
        paymentInfo: pool.paymentInfo ?? null,
        lastSyncAt: pool.tournament.lastSyncAt?.toISOString() ?? null,
        pendingReplacements,
      }}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.user.displayName,
        email: m.user.email,
        role: m.role,
        hasPaid: m.hasPaid,
        joinedAt: m.joinedAt.toISOString(),
        entriesSubmitted: entryCountMap.get(m.userId) || 0,
      }))}
      inviteUrl={inviteUrl}
    />
  );
}
