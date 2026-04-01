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
  tournament: { name: string; status: string };
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-green-900">
          Welcome, {user?.firstName ?? "Player"}
        </h1>
        <div className="flex gap-3">
          <Link href="/dashboard/create">
            <Button variant="primary">Create New Pool</Button>
          </Link>
        </div>
      </div>

      {/* Join section */}
      <form onSubmit={handleJoin} className="mt-6 flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter invite code"
          maxLength={8}
          className="flex-1 rounded-md border border-green-200 px-4 py-2.5 text-sm font-mono tracking-widest text-center focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 max-w-[200px]"
        />
        <Button variant="secondary" type="submit" disabled={!joinCode.trim()}>
          Join
        </Button>
      </form>

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
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {activePools.map((p) => (
                <PoolCard key={p.id} pool={p} />
              ))}
            </div>
          )}

          {archivedPools.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-800">
                Past Pools ({archivedPools.length})
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
  return (
    <div className="rounded-lg border border-green-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-green-900 truncate">{pool.name}</h3>
          <p className="mt-0.5 text-xs text-green-600">{pool.tournament.name}</p>
        </div>
        <StatusBadge status={pool.status} />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-green-600">
        <span>{pool.memberCount} members</span>
        <span>{pool.entryCount} entries</span>
      </div>

      <CardSubtext pool={pool} />

      <div className="mt-3 flex flex-wrap gap-2">
        <CardLinks pool={pool} />
      </div>
    </div>
  );
}

function CardSubtext({ pool }: { pool: PoolItem }) {
  if (pool.status === "LIVE") return <p className="mt-2 text-xs text-red-600 font-medium">Tournament in progress</p>;
  if (pool.status === "OPEN" && !pool.hasSubmittedPicks) {
    const d = new Date(pool.picksDeadline);
    return (
      <p className="mt-2 text-xs text-amber-600">
        Picks due {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
    );
  }
  if (pool.status === "LOCKED") return <p className="mt-2 text-xs text-amber-600">Waiting for tournament</p>;
  return null;
}

/** State-matrix-driven link rendering */
function CardLinks({ pool }: { pool: PoolItem }) {
  const links: React.ReactNode[] = [];

  // Organizer: Manage link on all active statuses
  if (pool.isOrganizer && pool.status !== "ARCHIVED") {
    links.push(
      <CardLink key="manage" href={`/pool/${pool.id}/manage`} label="Manage" variant="primary" />
    );
  }

  // Status-specific links per state matrix
  switch (pool.status) {
    case "SETUP":
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="Leaderboard" />);
      break;
    case "OPEN":
      if (!pool.hasSubmittedPicks) {
        links.push(<CardLink key="picks" href={`/pool/${pool.id}/picks`} label="Make Picks" variant="accent" />);
      }
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="Leaderboard" />);
      break;
    case "LOCKED":
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="Leaderboard" />);
      links.push(<CardLink key="entries" href={`/pool/${pool.id}/my-entries`} label="My Entries" />);
      break;
    case "LIVE":
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="Live Leaderboard" variant="live" />);
      links.push(<CardLink key="entries" href={`/pool/${pool.id}/my-entries`} label="My Entries" />);
      break;
    case "COMPLETE":
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="Results" />);
      links.push(<CardLink key="entries" href={`/pool/${pool.id}/my-entries`} label="My Entries" />);
      break;
    case "ARCHIVED":
      links.push(<CardLink key="lb" href={`/pool/${pool.id}/leaderboard`} label="View Archive" />);
      break;
  }

  return <>{links}</>;
}

function CardLink({
  href,
  label,
  variant = "default",
}: {
  href: string;
  label: string;
  variant?: "default" | "primary" | "accent" | "live";
}) {
  const styles = {
    default: "border border-green-300 text-green-700 hover:bg-green-50",
    primary: "bg-green-800 text-white hover:bg-green-900",
    accent: "bg-amber-600 text-white hover:bg-amber-700",
    live: "bg-red-700 text-white hover:bg-red-800 animate-pulse",
  };

  return (
    <Link
      href={href}
      className={`inline-block rounded px-3 py-1.5 text-xs font-medium min-h-[32px] inline-flex items-center ${styles[variant]}`}
    >
      {label}
    </Link>
  );
}
