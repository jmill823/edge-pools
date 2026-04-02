"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface PickData {
  golfer: { id: string; name: string; country: string | null; owgr: number | null };
  category: { id: string; name: string; sortOrder: number };
}

interface EntryData {
  id: string;
  entryNumber: number;
  submittedAt: string;
  updatedAt: string;
  picks: PickData[];
}

interface PoolData {
  id: string;
  name: string;
  status: string;
  picksDeadline: string;
}

export default function MyEntriesPage({ params }: { params: { id: string } }) {
  const [pool, setPool] = useState<PoolData | null>(null);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pools/${params.id}`).then((r) => r.json()),
      fetch(`/api/pools/${params.id}/entries/mine`).then((r) => r.json()),
    ]).then(([poolData, entryData]) => {
      setPool(poolData);
      setEntries(Array.isArray(entryData) ? entryData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><LoadingSkeleton variant="page" lines={5} /></div>;
  if (!pool) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-red-600">Pool not found</div>;

  const canEdit = pool.status === "OPEN" && new Date(pool.picksDeadline) > new Date();

  if (entries.length === 0) {
    if (pool.status === "OPEN" && canEdit) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <EmptyState
            title="No picks yet"
            description="You haven't submitted picks for this pool."
            action={
              <Link href={`/pool/${params.id}/picks`}>
                <Button>Make Picks</Button>
              </Link>
            }
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="No picks submitted"
          description={
            pool.status === "SETUP"
              ? "This pool is being set up. Picks will open soon."
              : "You didn't submit picks for this pool."
          }
        />
      </div>
    );
  }

  // Single entry (Session 2 — only first entry shown)
  const entry = entries[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-green-900">My Picks</h2>
        {canEdit && (
          <Link href={`/pool/${params.id}/picks`}>
            <Button variant="secondary">Edit Picks</Button>
          </Link>
        )}
      </div>

      <p className="text-xs text-green-500 mb-4">
        Submitted {new Date(entry.submittedAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        })}
        {entry.updatedAt !== entry.submittedAt && (
          <span>
            {" "}· Updated {new Date(entry.updatedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
        )}
      </p>

      <div className="rounded-lg border border-green-200 divide-y divide-green-100">
        {entry.picks
          .sort((a, b) => a.category.sortOrder - b.category.sortOrder)
          .map((pick) => (
            <div key={pick.category.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <span className="text-xs text-green-500">{pick.category.name}</span>
                <span className="block text-sm font-medium text-green-900 truncate">{pick.golfer.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-green-500">
                {pick.golfer.country && <span>{pick.golfer.country}</span>}
                {pick.golfer.owgr && <span>#{pick.golfer.owgr}</span>}
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6">
        <Link href={`/pool/${params.id}/leaderboard`}>
          <Button variant="secondary" className="w-full">View Leaderboard</Button>
        </Link>
      </div>
    </div>
  );
}
