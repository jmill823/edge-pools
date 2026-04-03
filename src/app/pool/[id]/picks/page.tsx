"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PickStrip } from "./_components/PickStrip";
import { SelectionGrid } from "./_components/SelectionGrid";
import { ConfirmModal } from "./_components/ConfirmModal";
import { SuccessScreen } from "./_components/SuccessScreen";
import { Countdown } from "./_components/Countdown";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";

interface Golfer { id: string; name: string; country: string | null; owgr: number | null; }
interface Category { id: string; name: string; sortOrder: number; golfers: Golfer[]; }
interface PoolInfo { id: string; name: string; status: string; picksDeadline: string; maxEntries: number; }
interface ExistingEntry { id: string; entryNumber: number; picks: { category: { id: string }; golfer: { id: string } }[]; }

export default function PicksPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();

  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allEntries, setAllEntries] = useState<ExistingEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ExistingEntry | null>(null);
  const [selections, setSelections] = useState<Map<string, string>>(new Map());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [lastSubmittedEntryNumber, setLastSubmittedEntryNumber] = useState(1);

  const isEdit = !!editingEntry;
  const entryCount = allEntries.length;
  const maxEntries = pool?.maxEntries ?? 1;
  const isMultiEntry = maxEntries > 1;

  // Derived state
  const usedGolferIds = useMemo(() => new Set(selections.values()), [selections]);
  const pickCount = usedGolferIds.size - (usedGolferIds.has("") ? 1 : 0);
  const isComplete = pickCount === categories.length && categories.length > 0;

  const golferLookup = useMemo(() => {
    const map = new Map<string, Golfer>();
    for (const cat of categories) for (const g of cat.golfers) map.set(g.id, g);
    return map;
  }, [categories]);

  const golferCategoryCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of categories) for (const g of cat.golfers) map.set(g.id, (map.get(g.id) || 0) + 1);
    return map;
  }, [categories]);

  // Load pool, categories, and user's entries
  useEffect(() => {
    const poolP = fetch(`/api/pools/${params.id}`).then((r) => r.ok ? r.json() : null).catch(() => null);
    const catsP = fetch(`/api/pools/${params.id}/categories`).then((r) => r.ok ? r.json() : []).catch(() => []);
    const entP = fetch(`/api/pools/${params.id}/entries/mine`).then((r) => r.ok ? r.json() : []).catch(() => []);

    Promise.all([poolP, catsP, entP]).then(([p, c, e]) => {
      if (p?.status) {
        setPool(p);
        if (p.picksDeadline && new Date(p.picksDeadline) < new Date()) setExpired(true);
      }
      if (Array.isArray(c) && c.length > 0) setCategories(c);

      const entries: ExistingEntry[] = Array.isArray(e) ? e : [];
      setAllEntries(entries);

      // Determine which entry to edit based on URL param or default
      const entryIdParam = searchParams.get("entryId");
      if (entryIdParam && entries.length > 0) {
        const target = entries.find((en) => en.id === entryIdParam);
        if (target) {
          loadEntrySelections(target);
        }
      } else if (entries.length > 0 && (p?.maxEntries ?? 1) === 1) {
        // Single-entry: auto-load the only entry for editing
        loadEntrySelections(entries[0]);
      }
      // Multi-entry with no entryId param: start fresh for new entry

      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function loadEntrySelections(entry: ExistingEntry) {
    setEditingEntry(entry);
    const sels = new Map<string, string>();
    entry.picks.forEach((pk) => sels.set(pk.category.id, pk.golfer.id));
    setSelections(sels);
  }

  const handleSelect = useCallback((categoryId: string, golferId: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      if (golferId) next.set(categoryId, golferId); else next.delete(categoryId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!pool) return;
    setSubmitting(true); setSubmitError(null);
    const picks = Array.from(selections.entries()).map(([categoryId, golferId]) => ({ categoryId, golferId }));
    try {
      const url = isEdit ? `/api/pools/${params.id}/entries/${editingEntry!.id}` : `/api/pools/${params.id}/entries`;
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ picks }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setSubmitError(d.error || "Failed to submit"); setSubmitting(false); return; }

      // Track the entry number for the success screen
      if (isEdit) {
        setLastSubmittedEntryNumber(editingEntry!.entryNumber);
      } else {
        setLastSubmittedEntryNumber(entryCount + 1);
        // Update allEntries count so SuccessScreen shows correct count
        setAllEntries((prev) => [...prev, { id: "temp", entryNumber: entryCount + 1, picks: [] }]);
      }

      setShowConfirm(false); setShowSuccess(true);
    } catch { setSubmitError("Something went wrong. Please try again."); }
    setSubmitting(false);
  }, [pool, params.id, selections, isEdit, editingEntry, entryCount]);

  // "Add Another Entry" handler — resets to fresh state
  const handleAddAnother = useCallback(() => {
    setShowSuccess(false);
    setEditingEntry(null);
    setSelections(new Map());
    setSubmitError(null);
    setShowConfirm(false);
    // Refresh entries list
    fetch(`/api/pools/${params.id}/entries/mine`)
      .then((r) => r.ok ? r.json() : [])
      .then((e) => { if (Array.isArray(e)) setAllEntries(e); })
      .catch(() => {});
  }, [params.id]);

  // Entry selector for multi-entry editing
  const handleEntrySwitch = useCallback((entryId: string) => {
    const entry = allEntries.find((e) => e.id === entryId);
    if (entry) loadEntrySelections(entry);
  }, [allEntries]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><LoadingSkeleton variant="page" lines={5} /></div>;
  if (!pool) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-red-600">Could not load pool data.</div>;
  if (pool.status === "SETUP") return <Msg text="This pool is being set up. Picks will open soon." />;
  if (pool.status === "ARCHIVED") return <Msg text="This pool has been archived." />;

  const readOnly = pool.status !== "OPEN" || expired;
  if (readOnly && allEntries.length === 0) {
    return <Msg text={expired ? "The picks deadline has passed." : pool.status === "LIVE" ? "Picks are locked. Tournament is in progress." : "Picks are locked."} />;
  }

  if (showSuccess) {
    return (
      <SuccessScreen
        poolId={pool.id}
        poolName={pool.name}
        pickCount={pickCount}
        isEdit={isEdit}
        entryNumber={lastSubmittedEntryNumber}
        maxEntries={maxEntries}
        currentEntryCount={allEntries.length}
        onAddAnother={handleAddAnother}
      />
    );
  }

  if (categories.length === 0) return <Msg text="No categories found. The organizer may still be setting up." />;

  const picksForConfirm = categories.map((c) => {
    const gId = selections.get(c.id); const g = gId ? golferLookup.get(gId) : null;
    return { categoryName: c.name, golferName: g?.name || "", golferCountry: g?.country || null, golferOwgr: g?.owgr || null };
  });

  const headerLabel = isEdit
    ? isMultiEntry ? `Edit Entry ${editingEntry!.entryNumber}` : "Edit your picks"
    : isMultiEntry ? `New Entry (${entryCount + 1} of ${maxEntries})` : "Make your picks";

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-green-900">{headerLabel}</h2>
            <span className="text-xs text-green-600">{pickCount} of {categories.length} complete</span>
          </div>
          {!readOnly && pool.picksDeadline && <Countdown deadline={pool.picksDeadline} onExpired={() => setExpired(true)} />}
        </div>

        {/* Entry selector for multi-entry editing */}
        {isMultiEntry && allEntries.length > 1 && isEdit && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {allEntries.map((e) => (
              <button
                key={e.id}
                onClick={() => handleEntrySwitch(e.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium min-h-[32px] ${
                  editingEntry?.id === e.id
                    ? "bg-green-800 text-white"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                Entry {e.entryNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {readOnly && allEntries.length > 0 && (
        <div className="mx-4 mb-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800 shrink-0">
          {expired ? "Deadline passed. Your picks are locked." : "Picks are locked."}
        </div>
      )}

      {/* Pick strip */}
      <div className="shrink-0">
        <PickStrip categories={categories} selections={selections} golferLookup={golferLookup} />
      </div>

      {/* Selection grid */}
      <SelectionGrid
        categories={categories}
        selections={selections}
        golferCategoryCount={golferCategoryCount}
        usedGolferIds={usedGolferIds}
        onSelect={handleSelect}
        readOnly={readOnly}
      />

      {/* Footer */}
      {!readOnly && (
        <div className="shrink-0 border-t border-green-200 bg-white px-4 py-3 safe-area-pb">
          <div className="mb-2 flex items-center gap-3 text-[10px] text-green-500">
            <span><span className="text-green-600 font-bold">●</span> your pick</span>
            <span><span className="line-through">name</span> already used</span>
            <span><span className="text-amber-600 font-bold">³</span> multiple categories</span>
          </div>
          <Button variant="primary" className="w-full" disabled={!isComplete} onClick={() => setShowConfirm(true)}>
            {isEdit ? `Save changes (${pickCount}/${categories.length})` : `Submit picks (${pickCount}/${categories.length})`}
          </Button>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal picks={picksForConfirm} poolName={pool.name} isEdit={isEdit} submitting={submitting}
          error={submitError} onConfirm={handleSubmit} onCancel={() => { setShowConfirm(false); setSubmitError(null); }}
          onDismissError={() => setSubmitError(null)} />
      )}
    </div>
  );
}

function Msg({ text }: { text: string }) {
  return <div className="mx-auto max-w-3xl px-4 py-12 text-center"><p className="text-sm text-green-600">{text}</p></div>;
}
