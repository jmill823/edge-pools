"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PickStrip } from "@/components/ui/PickStrip";
import { formatScore, scoreColor, formatRankWithTies } from "../leaderboard/_components/score-utils";

interface PickData {
  golfer: { id: string; name: string; country: string | null; owgr: number | null };
  category: { id: string; name: string; sortOrder: number };
}

interface EntryData {
  id: string;
  entryNumber: number;
  teamScore: number | null;
  rank: number | null;
  submittedAt: string;
  updatedAt: string;
  picks: PickData[];
}

interface PoolData {
  id: string;
  name: string;
  status: string;
  picksDeadline: string;
  maxEntries: number;
  tournamentId: string;
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
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const maxEntries = pool.maxEntries ?? 1;
  const isMultiEntry = maxEntries > 1;
  const canAddMore = canEdit && entries.length < maxEntries;
  const allRanks = entries.map((e) => e.rank);

  if (entries.length === 0) {
    if (pool.status === "OPEN" && canEdit) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <EmptyState
            title="No picks yet"
            description="You haven't submitted picks for this pool."
            action={<Link href={`/pool/${params.id}/picks`}><Button>Make Picks</Button></Link>}
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="No picks submitted"
          description={pool.status === "SETUP" ? "This pool is being set up." : "You didn't submit picks for this pool."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-green-900">
          {isMultiEntry ? "My Entries" : "My Picks"}
        </h2>
        {/* Single-entry: show edit button in header */}
        {!isMultiEntry && canEdit && (
          <Link href={`/pool/${params.id}/picks`}>
            <Button variant="secondary">Edit Picks</Button>
          </Link>
        )}
      </div>

      {/* Entry cards */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            poolId={params.id}
            isMultiEntry={isMultiEntry}
            canEdit={canEdit}
            hasScores={hasScores}
            allRanks={allRanks}
          />
        ))}
      </div>

      {/* Add another entry button */}
      {canAddMore && isMultiEntry && (
        <Link href={`/pool/${params.id}/picks`} className="block mt-4">
          <div className="rounded-lg border-2 border-dashed border-green-300 p-4 text-center hover:bg-green-50 transition-colors min-h-[44px] flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-green-700">+ Add Entry {entries.length + 1}</span>
            <span className="text-xs text-green-500 mt-1">{entries.length} of {maxEntries} entries used</span>
          </div>
        </Link>
      )}

      {/* Leaderboard link */}
      <div className="mt-6">
        <Link href={`/pool/${params.id}/leaderboard`}>
          <Button variant="secondary" className="w-full">View Leaderboard</Button>
        </Link>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  poolId,
  isMultiEntry,
  canEdit,
  hasScores,
  allRanks,
}: {
  entry: EntryData;
  poolId: string;
  isMultiEntry: boolean;
  canEdit: boolean;
  hasScores: boolean;
  allRanks: (number | null)[];
}) {
  const sortedPicks = entry.picks
    .slice()
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder);

  const pickStripData = sortedPicks.map((p) => ({
    categoryName: p.category.name,
    golferName: p.golfer.name,
  }));

  const submittedDate = new Date(entry.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-lg border border-green-200 overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            {isMultiEntry && (
              <span className="text-sm font-semibold text-green-900">Entry {entry.entryNumber}</span>
            )}
            <span className={`text-xs text-green-500 ${isMultiEntry ? "ml-2" : ""}`}>
              Submitted {submittedDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasScores && entry.teamScore !== null && (
            <div className="text-right">
              <span className={`text-lg font-bold ${scoreColor(entry.teamScore)}`}>
                {formatScore(entry.teamScore)}
              </span>
              {entry.rank !== null && (
                <span className="ml-2 text-xs text-green-600">
                  {formatRankWithTies(entry.rank, allRanks)}
                </span>
              )}
            </div>
          )}
          {canEdit && isMultiEntry && (
            <Link href={`/pool/${poolId}/picks?entryId=${entry.id}`}>
              <Button variant="secondary" className="text-xs px-3 py-1">Edit</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Pick strip */}
      <PickStrip picks={pickStripData} />
    </div>
  );
}
