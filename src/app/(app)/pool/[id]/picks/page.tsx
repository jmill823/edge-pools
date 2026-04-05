"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SelectionGrid } from "./_components/SelectionGrid";
import { ConfirmModal } from "./_components/ConfirmModal";
import { SuccessScreen } from "./_components/SuccessScreen";
import { Countdown } from "./_components/Countdown";
import { BubbleStrip } from "./_components/BubbleStrip";
import { StickyBottomBar } from "./_components/StickyBottomBar";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Golfer { id: string; name: string; country: string | null; owgr: number | null; }
interface Category { id: string; name: string; qualifier?: string | null; sortOrder: number; golfers: Golfer[]; }
interface PoolInfo { id: string; name: string; status: string; picksDeadline: string; maxEntries: number; }
interface ExistingEntry { id: string; entryNumber: number; teamName: string; picks: { category: { id: string }; golfer: { id: string } }[]; }

export default function PicksPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null!);  // non-null assertion for ref forwarding

  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allEntries, setAllEntries] = useState<ExistingEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ExistingEntry | null>(null);
  const [selections, setSelections] = useState<Map<string, string>>(new Map());
  const [teamName, setTeamName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [lastSubmittedEntryNumber, setLastSubmittedEntryNumber] = useState(1);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const isEdit = !!editingEntry;
  const entryCount = allEntries.length;
  const maxEntries = pool?.maxEntries ?? 1;
  const isMultiEntry = maxEntries > 1;

  const usedGolferIds = useMemo(() => new Set(selections.values()), [selections]);
  const pickCount = usedGolferIds.size - (usedGolferIds.has("") ? 1 : 0);
  const isComplete = pickCount === categories.length && categories.length > 0 && teamName.trim().length > 0;

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

  // Set initial active category to first unpicked
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      const firstUnpicked = categories.find((c) => !selections.has(c.id));
      setActiveCategoryId(firstUnpicked?.id ?? categories[0].id);
    }
  }, [categories, selections, activeCategoryId]);

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

      const entryIdParam = searchParams.get("entryId");
      if (entryIdParam && entries.length > 0) {
        const target = entries.find((en) => en.id === entryIdParam);
        if (target) loadEntrySelections(target);
      } else if (entries.length > 0 && (p?.maxEntries ?? 1) === 1) {
        loadEntrySelections(entries[0]);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function loadEntrySelections(entry: ExistingEntry) {
    setEditingEntry(entry);
    setTeamName(entry.teamName || "");
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

  // Auto-advance: scroll to the next unpicked category after a pick
  const handlePickMade = useCallback((pickedCategoryId: string) => {
    // Only auto-advance for new picks, not edits of existing selections
    setTimeout(() => {
      setSelections((currentSelections) => {
        // Find next unpicked category
        const nextUnpicked = categories.find(
          (c) => c.id !== pickedCategoryId && !currentSelections.has(c.id)
        );

        if (nextUnpicked && gridRef.current) {
          setActiveCategoryId(nextUnpicked.id);
          // Find the column header to scroll to
          const header = gridRef.current.querySelector(
            `th[data-category-id="${nextUnpicked.id}"]`
          );
          if (header) {
            const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            header.scrollIntoView({
              behavior: prefersReduced ? "instant" : "smooth",
              block: "nearest",
              inline: "start",
            });
          }
        } else if (!nextUnpicked) {
          // All picked — stay on current
          setActiveCategoryId(pickedCategoryId);
        }

        return currentSelections; // Don't modify
      });
    }, 300);
  }, [categories]);

  // Bubble tap scrolls to that category
  const handleBubbleTap = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    if (gridRef.current) {
      const header = gridRef.current.querySelector(
        `th[data-category-id="${categoryId}"]`
      );
      if (header) {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        header.scrollIntoView({
          behavior: prefersReduced ? "instant" : "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!pool) return;
    setSubmitting(true); setSubmitError(null);
    const picks = Array.from(selections.entries()).map(([categoryId, golferId]) => ({ categoryId, golferId }));
    try {
      const url = isEdit ? `/api/pools/${params.id}/entries/${editingEntry!.id}` : `/api/pools/${params.id}/entries`;
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ picks, teamName: teamName.trim() }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setSubmitError(d.error || "Failed to submit"); setSubmitting(false); return; }

      if (isEdit) {
        setLastSubmittedEntryNumber(editingEntry!.entryNumber);
      } else {
        setLastSubmittedEntryNumber(entryCount + 1);
        setAllEntries((prev) => [...prev, { id: "temp", entryNumber: entryCount + 1, teamName: teamName.trim(), picks: [] }]);
      }
      setShowConfirm(false); setShowSuccess(true);
    } catch { setSubmitError("Something went wrong. Please try again."); }
    setSubmitting(false);
  }, [pool, params.id, selections, isEdit, editingEntry, entryCount, teamName]);

  const handleAddAnother = useCallback(() => {
    setShowSuccess(false);
    setEditingEntry(null);
    setSelections(new Map());
    setTeamName("");
    setSubmitError(null);
    setShowConfirm(false);
    setActiveCategoryId(null);
    fetch(`/api/pools/${params.id}/entries/mine`)
      .then((r) => r.ok ? r.json() : [])
      .then((e) => { if (Array.isArray(e)) setAllEntries(e); })
      .catch(() => {});
  }, [params.id]);

  const handleEntrySwitch = useCallback((entryId: string) => {
    const entry = allEntries.find((e) => e.id === entryId);
    if (entry) loadEntrySelections(entry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntries]);

  if (loading) return <div className="mx-auto max-w-content px-4 py-8"><LoadingSkeleton variant="page" lines={5} /></div>;
  if (!pool) return <Msg text="Could not load pool data." />;
  if (pool.status === "SETUP") return <Msg text="This pool is being set up. Picks will open soon." />;
  if (pool.status === "ARCHIVED") return <Msg text="This pool has been archived." />;

  const readOnly = pool.status !== "OPEN" || expired;
  if (readOnly && allEntries.length === 0) {
    return <Msg text={expired ? "The picks deadline has passed." : pool.status === "LIVE" ? "Picks are locked. Tournament is in progress." : "Picks are locked."} />;
  }

  if (showSuccess) {
    return (
      <SuccessScreen poolId={pool.id} poolName={pool.name} pickCount={pickCount} isEdit={isEdit}
        entryNumber={lastSubmittedEntryNumber} maxEntries={maxEntries} currentEntryCount={allEntries.length} onAddAnother={handleAddAnother} />
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
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)] mx-auto w-full md:w-[80%] md:max-w-[1200px]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{headerLabel}</h2>
            <span className="font-mono text-xs text-text-secondary">{pickCount} of {categories.length} complete</span>
          </div>
          {!readOnly && pool.picksDeadline && <Countdown deadline={pool.picksDeadline} onExpired={() => setExpired(true)} />}
        </div>

        {isMultiEntry && allEntries.length > 1 && isEdit && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {allEntries.map((e) => (
              <button key={e.id} onClick={() => handleEntrySwitch(e.id)}
                className={`shrink-0 rounded-data px-3 py-1 font-body text-xs font-medium min-h-[32px] cursor-pointer transition-colors duration-200 ${
                  editingEntry?.id === e.id ? "bg-accent-primary text-white" : "bg-surface-alt text-text-secondary border border-border"
                }`}>
                {e.teamName || `Entry ${e.entryNumber}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Team name input */}
      {!readOnly && (
        <div className="px-4 pb-2 shrink-0">
          <label className="block font-body text-xs font-medium text-text-secondary mb-1">Name your team</label>
          <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value.slice(0, 30))}
            placeholder="Danny's Daggers, The Long Shot Squad..."
            className="w-full rounded-[6px] border border-border bg-surface px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-[rgba(27,94,59,0.15)]"
            maxLength={30} />
          <span className="block mt-0.5 font-mono text-[10px] text-text-muted text-right">{teamName.length}/30</span>
        </div>
      )}

      {readOnly && allEntries.length > 0 && (
        <div className="mx-4 mb-2 rounded-data bg-[#FDF4E3] px-3 py-2 font-body text-xs text-[#8A6B1E] shrink-0">
          {expired ? "Deadline passed. Your picks are locked." : "Picks are locked."}
        </div>
      )}

      {/* Bubble strip */}
      <div className="shrink-0">
        <BubbleStrip categories={categories} selections={selections} golferLookup={golferLookup}
          activeCategoryId={activeCategoryId} onBubbleTap={handleBubbleTap} />
      </div>

      {/* Selection grid */}
      <SelectionGrid categories={categories} selections={selections} golferCategoryCount={golferCategoryCount}
        usedGolferIds={usedGolferIds} onSelect={handleSelect} readOnly={readOnly}
        onPickMade={handlePickMade} gridRef={gridRef} />

      {/* Sticky bottom bar — only in edit mode */}
      {!readOnly && (
        <StickyBottomBar pickCount={pickCount} totalCategories={categories.length} isEdit={isEdit}
          isComplete={isComplete} onSubmit={() => setShowConfirm(true)} />
      )}

      {/* Spacer for sticky bottom bar — extra for safe-area on notched phones */}
      {!readOnly && <div className="shrink-0 h-20" />}

      {showConfirm && (
        <ConfirmModal picks={picksForConfirm} poolName={pool.name} isEdit={isEdit} submitting={submitting}
          error={submitError} onConfirm={handleSubmit} onCancel={() => { setShowConfirm(false); setSubmitError(null); }}
          onDismissError={() => setSubmitError(null)} />
      )}
    </div>
  );
}

function Msg({ text }: { text: string }) {
  return <div className="mx-auto max-w-content px-4 py-12 text-center"><p className="font-body text-sm text-text-secondary">{text}</p></div>;
}
