"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

interface PoolItem {
  id: string;
  name: string;
  status: string;
  picksDeadline: string;
  memberCount: number;
  entryCount: number;
  hasSubmittedPicks: boolean;
  isOrganizer: boolean;
  myBestRank: number | null;
  myBestScore: number | null;
  tournament: { name: string; status: string; currentRound?: number };
}

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0, OPEN: 1, LOCKED: 2, SETUP: 3, COMPLETE: 4, ARCHIVED: 5,
};

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a: PoolItem, b: PoolItem) =>
          (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
        );
        setPools(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activePools = pools.filter((p) => p.status !== "ARCHIVED");
  const archivedPools = pools.filter((p) => p.status === "ARCHIVED");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) router.push(`/join/${joinCode.trim()}`);
  }

  if (loading) return null; // loading.tsx handles this

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-green-900">
        Welcome, {user?.firstName ?? "Player"}
      </h1>

      {/* Action strip */}
      <div className="mt-4 flex gap-3 items-center">
        <Link href="/dashboard/create">
          <Button variant="primary">+ Create Pool</Button>
        </Link>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Invite code"
            maxLength={8}
            className="rounded-md border border-green-200 px-3 py-2 text-sm font-mono tracking-widest text-center focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 w-[130px] min-h-[44px]"
          />
          <Button variant="secondary" type="submit" disabled={!joinCode.trim()}>
            Join
          </Button>
        </form>
      </div>

      {/* Pool cards */}
      {activePools.length === 0 && archivedPools.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No pools yet"
            description="You haven't joined any pools yet. Create one or enter an invite code."
            action={
              <Link href="/dashboard/create">
                <Button>Create Your First Pool</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {activePools.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-semibold text-green-700 uppercase tracking-wide">Active</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {activePools.map((p) => (
                  <PoolCard key={p.id} pool={p} />
                ))}
              </div>
            </>
          )}

          {archivedPools.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-800">
                Past Pools ({archivedPools.length})
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 opacity-70">
                {archivedPools.map((p) => (
                  <PoolCard key={p.id} pool={p} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function PoolCard({ pool }: { pool: PoolItem }) {
  const href = pool.status === "LIVE"
    ? `/pool/${pool.id}/leaderboard`
    : pool.status === "OPEN" && !pool.hasSubmittedPicks
      ? `/pool/${pool.id}/picks`
      : `/pool/${pool.id}/leaderboard`;

  return (
    <Link href={href} className="block">
      <div className="rounded-lg border border-green-200 p-4 hover:border-green-400 transition-colors">
        {/* Top: name + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-green-900 truncate">{pool.name}</h3>
            <p className="mt-0.5 text-xs text-green-600">{pool.tournament.name}</p>
          </div>
          <StatusBadge status={pool.status} />
        </div>

        {/* Mini status strip */}
        <div className="mt-3 flex gap-2 overflow-x-auto -webkit-overflow-scrolling-touch">
          <MiniStripItems pool={pool} />
        </div>
      </div>
    </Link>
  );
}

function MiniStripItems({ pool }: { pool: PoolItem }) {
  const chips: { label: string; style?: string }[] = [];

  switch (pool.status) {
    case "OPEN": {
      const d = new Date(pool.picksDeadline);
      const now = new Date();
      const hoursLeft = Math.max(0, Math.floor((d.getTime() - now.getTime()) / 3600000));
      const deadlineStr = hoursLeft <= 48
        ? `${hoursLeft}h left`
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      chips.push({ label: deadlineStr, style: "bg-[#FAEEDA] text-[#633806]" });
      chips.push({ label: `${pool.entryCount} entries` });
      if (!pool.hasSubmittedPicks) {
        chips.push({ label: "No picks yet", style: "bg-amber-100 text-amber-700" });
      }
      break;
    }
    case "LIVE": {
      if (pool.myBestRank !== null && pool.myBestScore !== null) {
        const score = pool.myBestScore > 0 ? `+${pool.myBestScore}` : pool.myBestScore === 0 ? "E" : `${pool.myBestScore}`;
        chips.push({ label: `T${pool.myBestRank} ${score}`, style: "bg-[#E6F1FB] text-blue-800 font-bold" });
      }
      chips.push({ label: `${pool.entryCount} entries` });
      if (pool.tournament.currentRound) {
        chips.push({ label: `R${pool.tournament.currentRound} live`, style: "bg-[#FCEBEB] text-[#791F1F]" });
      }
      break;
    }
    case "COMPLETE": {
      if (pool.myBestRank !== null && pool.myBestScore !== null) {
        const score = pool.myBestScore > 0 ? `+${pool.myBestScore}` : pool.myBestScore === 0 ? "E" : `${pool.myBestScore}`;
        chips.push({ label: `Finished ${pool.myBestRank}${ordSuffix(pool.myBestRank)} (${score})`, style: "bg-[#E1F5EE] text-[#085041]" });
      }
      chips.push({ label: `${pool.entryCount} entries` });
      break;
    }
    case "LOCKED":
      chips.push({ label: "Picks locked" });
      chips.push({ label: `${pool.entryCount} entries` });
      break;
    case "SETUP":
      chips.push({ label: "Setting up" });
      chips.push({ label: `${pool.memberCount} members` });
      break;
    case "ARCHIVED":
      chips.push({ label: `${pool.entryCount} entries` });
      break;
  }

  if (pool.isOrganizer) {
    chips.push({ label: "Organizer", style: "bg-green-100 text-green-700" });
  }

  return (
    <>
      {chips.map((chip, i) => (
        <span
          key={i}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            chip.style || "bg-gray-100 text-gray-600"
          }`}
        >
          {chip.label}
        </span>
      ))}
    </>
  );
}

function ordSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
