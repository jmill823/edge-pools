import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LeaderboardPlaceholder({
  params,
}: {
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: { tournament: { select: { name: true } } },
  });

  if (!pool) redirect("/dashboard");

  const messages: Record<string, { title: string; description: string }> = {
    SETUP: {
      title: "Pool is being set up",
      description: "Check back when picks are open.",
    },
    OPEN: {
      title: "Picks are open",
      description: `Picks are open until ${new Date(pool.picksDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}. Leaderboard will update once the tournament starts.`,
    },
    LOCKED: {
      title: "Picks locked",
      description: `Waiting for ${pool.tournament.name} to begin.`,
    },
    LIVE: {
      title: "Live leaderboard",
      description: "Live leaderboard coming in next update.",
    },
    COMPLETE: {
      title: "Final results",
      description: "Final results coming in next update.",
    },
    ARCHIVED: {
      title: "Archived",
      description: "This pool has been archived.",
    },
  };

  const msg = messages[pool.status] || messages.SETUP;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4v11H3zM10 3h4v18h-4zM17 7h4v14h-4z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-green-900">{msg.title}</h2>
      <p className="mt-2 text-sm text-green-600">{msg.description}</p>
    </div>
  );
}
