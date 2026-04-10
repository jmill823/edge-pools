import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { PoolNav } from "@/components/ui/PoolNav";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: pool?.name ?? "Pool",
    description:
      "View pool details, invite players, and manage your golf pool.",
  };
}

export default async function PoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) {
    redirect("/sign-in");
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: { select: { name: true } },
    },
  });

  if (!pool) {
    redirect("/dashboard");
  }

  // Check membership
  const membership = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: user.id } },
  });

  const isOrganizer = membership?.role === "ORGANIZER" || pool.organizerId === user.id;

  // Non-members get redirected to join (except invite page handled by its own logic)
  if (!membership && !isOrganizer) {
    redirect(`/join?code=${pool.inviteCode}`);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.14)-theme(spacing.16))]">
      <PoolNav
        poolId={pool.id}
        poolName={pool.name}
        poolStatus={pool.status}
        isOrganizer={isOrganizer}
        inviteCode={pool.inviteCode}
      />
      {/* Content area — add bottom padding on mobile for tab bar */}
      <div className="flex-1 pb-20 sm:pb-0">{children}</div>
    </div>
  );
}
