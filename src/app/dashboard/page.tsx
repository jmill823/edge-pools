"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface PoolItem {
  id: string;
  name: string;
  status: string;
  picksDeadline: string;
  memberCount: number;
  entryCount: number;
  hasSubmittedPicks: boolean;
  isOrganizer: boolean;
  tournament: {
    name: string;
    status: string;
  };
}

export default function DashboardPage() {
  const { user } = useUser();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((data) => {
        setPools(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-900">
          Welcome, {user?.firstName ?? "Player"}
        </h1>
        <div className="flex gap-3">
          <Link
            href="/join"
            className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Join a Pool
          </Link>
          <Link
            href="/dashboard/create"
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Create New Pool
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-green-600">Loading...</p>
      ) : pools.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-green-600">You haven&apos;t joined any pools yet.</p>
          <p className="mt-2 text-sm text-green-500">
            Create a new pool or join one with an invite code.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {pools.map((p) => (
            <PoolCard key={p.id} pool={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PoolCard({ pool }: { pool: PoolItem }) {
  const badge = getBadge(pool);

  return (
    <div className="rounded-lg border border-green-200 p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-green-900 truncate">{pool.name}</h3>
          <p className="mt-0.5 text-xs text-green-600">{pool.tournament.name}</p>
        </div>
        <span
          className={`shrink-0 ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.style}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-green-600">
        <span>{pool.memberCount} members</span>
        <span>{pool.entryCount} entries</span>
      </div>
      {badge.sub && (
        <p className="mt-2 text-xs text-green-500">{badge.sub}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {pool.isOrganizer && (
          <Link
            href={`/pool/${pool.id}/manage`}
            className="inline-block rounded bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900"
          >
            Manage Pool
          </Link>
        )}
        {(pool.status === "OPEN" || pool.status === "SETUP") &&
          !pool.hasSubmittedPicks && (
            <Link
              href={`/pool/${pool.id}/picks`}
              className="inline-block rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Make Picks
            </Link>
          )}
        {pool.hasSubmittedPicks && (
          <Link
            href={`/pool/${pool.id}/my-entries`}
            className="inline-block rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
          >
            View Picks
          </Link>
        )}
        {(pool.status === "LIVE" || pool.status === "LOCKED" || pool.status === "COMPLETE") && (
          <Link
            href={`/pool/${pool.id}/leaderboard`}
            className="inline-block rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
          >
            Leaderboard
          </Link>
        )}
      </div>
    </div>
  );
}

function getBadge(pool: PoolItem) {
  if (pool.status === "LIVE" || pool.tournament.status === "LIVE") {
    return {
      label: "LIVE",
      style: "bg-red-100 text-red-700 animate-pulse",
      sub: "View leaderboard",
    };
  }
  if (pool.status === "COMPLETE") {
    return {
      label: "Complete",
      style: "bg-gray-100 text-gray-600",
      sub: "Results",
    };
  }
  if (pool.status === "LOCKED") {
    return {
      label: "Locked",
      style: "bg-amber-100 text-amber-700",
      sub: "Waiting for tournament",
    };
  }
  if (
    (pool.status === "OPEN" || pool.status === "SETUP") &&
    !pool.hasSubmittedPicks
  ) {
    const deadline = new Date(pool.picksDeadline);
    return {
      label: "Needs Picks",
      style: "bg-yellow-100 text-yellow-800",
      sub: `Picks due ${deadline.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    };
  }
  if (pool.hasSubmittedPicks) {
    return {
      label: "Picks In",
      style: "bg-green-100 text-green-700",
      sub: "Waiting for tournament",
    };
  }
  return {
    label: pool.status,
    style: "bg-gray-100 text-gray-600",
    sub: null,
  };
}
