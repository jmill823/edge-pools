"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PickStrip } from "@/components/ui/PickStrip";
import { SelectionGrid } from "@/components/ui/SelectionGrid";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { formatScore, scoreColor, formatRankWithTies } from "../leaderboard/_components/score-utils";

interface Golfer { id: string; name: string; country: string | null; owgr: number | null; }
interface CategoryData { id: string; name: string; qualifier?: string | null; sortOrder: number; golfers: Golfer[]; }

interface PickData {
  golfer: { id: string; name: string; country: string | null; owgr: number | null };
  category: { id: string; name: string; sortOrder: number };
}

interface EntryData {
  id: string;
  entryNumber: number;
  teamName: string;
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
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      fetch(`/api/pools/${params.id}`).then((r) => r.json()),
      fetch(`/api/pools/${params.id}/entries/mine`).then((r) => r.json()),
      fetch(`/api/pools/${params.id}/categories`).then((r) => r.ok ? r.json() : []),
    ]).then(([poolData, entryData, catData]) => {
      setPool(poolData);
      setEntries(Array.isArray(entryData) ? entryData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="mx-auto max-w-content px-4 py-8"><LoadingSkeleton variant="page" lines={5} /></div>;
  if (!pool) return <div className="mx-auto max-w-content px-4 py-12 text-center font-sans text-accent-danger">Pool not found</div>;

  const canEdit = pool.status === "OPEN" && new Date(pool.picksDeadline) > new Date();
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const maxEntries = pool.maxEntries ?? 1;
  const isMultiEntry = maxEntries > 1;
  const canAddMore = canEdit && entries.length < maxEntries;
  const allRanks = entries.map((e) => e.rank);

  if (entries.length === 0) {
    if (pool.status === "OPEN" && canEdit) {
      return (
        <div className="mx-auto max-w-content px-4 py-12">
          <EmptyState
            title="No picks yet"
            description="You haven't submitted picks for this pool."
            action={<Link href={`/pool/${params.id}/picks`}><Button>Make Picks</Button></Link>}
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-content px-4 py-12">
        <EmptyState
          title="No picks submitted"
          description={pool.status === "SETUP" ? "This pool is being set up." : "You didn't submit picks for this pool."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full md:w-[80%] md:max-w-[1200px] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-lg font-bold text-text-primary">
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
            canEdit={canEdit}
            hasScores={hasScores}
            allRanks={allRanks}
            categories={categories}
            onSaved={loadData}
          />
        ))}
      </div>

      {/* Add another entry button */}
      {canAddMore && isMultiEntry && (
        <Link href={`/pool/${params.id}/picks`} className="block mt-4">
          <div className="rounded-card border-2 border-dashed border-border p-4 text-center hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center cursor-pointer">
            <span className="font-sans text-sm font-medium text-accent-primary">+ Add Entry {entries.length + 1}</span>
            <span className="font-mono text-xs text-text-muted mt-1">{entries.length} of {maxEntries} entries used</span>
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
  canEdit,
  hasScores,
  allRanks,
  categories,
  onSaved,
}: {
  entry: EntryData;
  poolId: string;
  canEdit: boolean;
  hasScores: boolean;
  allRanks: (number | null)[];
  categories: CategoryData[];
  onSaved: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSelections, setEditSelections] = useState<Map<string, string>>(new Map());
  const [editTeamName, setEditTeamName] = useState(entry.teamName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sortedPicks = entry.picks
    .slice()
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder);

  const pickStripData = sortedPicks.map((p) => ({
    categoryName: p.category.name,
    golferName: p.golfer.name,
  }));

  // Derived state for editing
  const usedGolferIds = useMemo(() => new Set(editSelections.values()), [editSelections]);
  const golferCategoryCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of categories) for (const g of cat.golfers) map.set(g.id, (map.get(g.id) || 0) + 1);
    return map;
  }, [categories]);

  const pickCount = useMemo(() => {
    let count = 0;
    editSelections.forEach((v) => { if (v) count++; });
    return count;
  }, [editSelections]);

  const isEditComplete = pickCount === categories.length && categories.length > 0 && editTeamName.trim().length > 0;

  function startEditing() {
    const sels = new Map<string, string>();
    entry.picks.forEach((pk) => sels.set(pk.category.id, pk.golfer.id));
    setEditSelections(sels);
    setEditTeamName(entry.teamName);
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditSelections(new Map());
    setSaveError(null);
  }

  async function saveEdits() {
    setSaving(true);
    setSaveError(null);
    const picks = Array.from(editSelections.entries()).map(([categoryId, golferId]) => ({ categoryId, golferId }));
    try {
      const res = await fetch(`/api/pools/${poolId}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks, teamName: editTeamName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error || "Failed to save");
        setSaving(false);
        return;
      }
      setSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await onSaved();
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const handleSelect = useCallback((categoryId: string, golferId: string) => {
    setEditSelections((prev) => {
      const next = new Map(prev);
      if (golferId) next.set(categoryId, golferId); else next.delete(categoryId);
      return next;
    });
  }, []);

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden shadow-subtle">
      {/* Header */}
      <div className="bg-surface-alt px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <span className="block font-sans text-sm font-semibold text-text-primary truncate">
              {entry.teamName || `Entry ${entry.entryNumber}`}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              Submitted {new Date(entry.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
              {new Date(entry.submittedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasScores && entry.teamScore !== null && (
            <div className="text-right">
              <span className={`font-mono text-lg font-bold ${scoreColor(entry.teamScore)}`}>
                {formatScore(entry.teamScore)}
              </span>
              {entry.rank !== null && (
                <span className="ml-2 font-mono text-xs text-text-secondary">
                  {formatRankWithTies(entry.rank, allRanks)}
                </span>
              )}
            </div>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={startEditing}
              className="font-sans text-xs font-medium text-accent-primary cursor-pointer hover:underline min-h-[44px] flex items-center px-2"
            >
              Edit picks
            </button>
          )}
        </div>
      </div>

      {/* Success feedback */}
      {saveSuccess && (
        <div className="px-4 py-2">
          <InlineFeedback type="success" message="Picks updated successfully" />
        </div>
      )}

      {/* Pick strip (when not editing) */}
      {!isEditing && <PickStrip picks={pickStripData} />}

      {/* Inline edit mode */}
      {isEditing && (
        <div className="border-t border-border">
          {/* Team name edit */}
          <div className="px-4 pt-3 pb-2">
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Team name
            </label>
            <input
              type="text"
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value.slice(0, 30))}
              className="w-full rounded-[6px] border border-border bg-surface px-3 py-2 font-sans text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-[rgba(27,94,59,0.15)]"
              maxLength={30}
            />
          </div>

          {/* Selection grid — matches picks page layout */}
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto -webkit-overflow-scrolling-touch">
            <SelectionGrid
              categories={categories}
              selections={editSelections}
              golferCategoryCount={golferCategoryCount}
              usedGolferIds={usedGolferIds}
              onSelect={handleSelect}
              readOnly={false}
            />
          </div>

          {/* Error */}
          {saveError && (
            <div className="px-4 py-2">
              <InlineFeedback type="error" message={saveError} />
            </div>
          )}

          {/* Save/Cancel buttons */}
          <div className="px-4 py-3 flex gap-2 border-t border-border">
            <Button
              variant="primary"
              className="flex-1"
              disabled={!isEditComplete || saving}
              loading={saving}
              onClick={saveEdits}
            >
              Save changes ({pickCount}/{categories.length})
            </Button>
            <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
