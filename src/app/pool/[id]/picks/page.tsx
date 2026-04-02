"use client";

import { useState, useEffect, useCallback } from "react";
import { CategorySection } from "./_components/CategorySection";
import { SummaryBar } from "./_components/SummaryBar";
import { ConfirmModal } from "./_components/ConfirmModal";
import { SuccessScreen } from "./_components/SuccessScreen";
import { Countdown } from "./_components/Countdown";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";

interface Golfer { id: string; name: string; country: string | null; owgr: number | null; }
interface Category { id: string; name: string; sortOrder: number; golfers: Golfer[]; }
interface PoolInfo { id: string; name: string; status: string; picksDeadline: string; inviteCode: string; }
interface ExistingEntry { id: string; picks: { category: { id: string }; golfer: { id: string } }[]; }

export default function PicksPage({ params }: { params: { id: string } }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingEntry, setExistingEntry] = useState<ExistingEntry | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  const isEdit = !!existingEntry;
  const pickedGolferIds = new Set(Object.values(selections).filter(Boolean));
  const pickCount = pickedGolferIds.size;

  useEffect(() => {
    Promise.all([
      fetch(`/api/pools/${params.id}`).then((r) => r.json()),
      fetch(`/api/pools/${params.id}/categories`).then((r) => r.json()),
      fetch(`/api/pools/${params.id}/entries/mine`).then((r) => r.json()),
    ]).then(([poolData, cats, entries]) => {
      setPool(poolData);
      setCategories(Array.isArray(cats) ? cats : []);
      // Expand all categories initially
      if (Array.isArray(cats)) setExpanded(new Set(cats.map((c: Category) => c.id)));
      // Pre-fill if existing entry
      if (Array.isArray(entries) && entries.length > 0) {
        const entry = entries[0];
        setExistingEntry(entry);
        const sels: Record<string, string> = {};
        entry.picks.forEach((p: { category: { id: string }; golfer: { id: string } }) => {
          sels[p.category.id] = p.golfer.id;
        });
        setSelections(sels);
      }
      if (poolData.picksDeadline && new Date(poolData.picksDeadline) < new Date()) setExpired(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleSelect = useCallback((categoryId: string, golferId: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (golferId) { next[categoryId] = golferId; } else { delete next[categoryId]; }
      return next;
    });
    // Auto-scroll to next category
    if (golferId) {
      const idx = categories.findIndex((c) => c.id === categoryId);
      if (idx >= 0 && idx < categories.length - 1) {
        const nextCat = categories[idx + 1];
        setExpanded((prev) => new Set(prev).add(nextCat.id));
        setScrollTarget(nextCat.id);
        setTimeout(() => setScrollTarget(null), 500);
      }
    }
  }, [categories]);

  const handleSubmit = useCallback(async () => {
    if (!pool) return;
    setSubmitting(true);
    setSubmitError(null);
    const picks = Object.entries(selections).map(([categoryId, golferId]) => ({ categoryId, golferId }));
    try {
      const url = isEdit
        ? `/api/pools/${params.id}/entries/${existingEntry!.id}`
        : `/api/pools/${params.id}/entries`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Failed to submit picks");
        setSubmitting(false);
        return;
      }
      setShowConfirm(false);
      setShowSuccess(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }, [pool, params.id, selections, isEdit, existingEntry]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><LoadingSkeleton variant="page" lines={5} /></div>;
  if (!pool) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-red-600">Pool not found</div>;

  // Status gates per state matrix
  if (pool.status === "SETUP") return <StatusMsg msg="This pool is being set up. Picks will open soon." />;
  if (pool.status === "ARCHIVED") return <StatusMsg msg="This pool has been archived." />;
  const readOnly = pool.status !== "OPEN" || expired;
  if (readOnly && !existingEntry) {
    return <StatusMsg msg={pool.status === "OPEN" ? "The picks deadline has passed." : "Picks are locked."} />;
  }

  if (showSuccess) {
    return <SuccessScreen poolId={pool.id} poolName={pool.name} pickCount={pickCount} isEdit={isEdit} />;
  }

  const picksForConfirm = categories.map((c) => {
    const golferId = selections[c.id];
    const golfer = c.golfers.find((g) => g.id === golferId);
    return { categoryName: c.name, golferName: golfer?.name || "", golferCountry: golfer?.country || null, golferOwgr: golfer?.owgr || null };
  });

  return (
    <div className="pb-24 sm:pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-green-900">{isEdit ? "Edit Picks" : "Make Your Picks"}</h2>
        {!readOnly && pool.picksDeadline && <Countdown deadline={pool.picksDeadline} onExpired={() => setExpired(true)} />}
      </div>

      {readOnly && existingEntry && (
        <div className="mx-4 mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {expired ? "The picks deadline has passed. Your picks are locked." : "Picks are locked."}
        </div>
      )}

      {/* Categories */}
      <div className="divide-y divide-green-100 border-y border-green-100">
        {categories.map((cat) => {
          const otherPicks = new Set(
            Object.entries(selections).filter(([cId]) => cId !== cat.id).map(([, gId]) => gId).filter(Boolean)
          );
          return (
            <CategorySection
              key={cat.id}
              categoryId={cat.id}
              categoryName={cat.name}
              sortOrder={cat.sortOrder}
              golfers={cat.golfers}
              selectedGolferId={selections[cat.id] || null}
              pickedElsewhere={otherPicks}
              onSelect={handleSelect}
              isExpanded={expanded.has(cat.id)}
              onToggle={() => setExpanded((prev) => { const n = new Set(prev); if (n.has(cat.id)) { n.delete(cat.id); } else { n.add(cat.id); } return n; })}
              shouldScrollTo={scrollTarget === cat.id}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* Desktop submit */}
      {!readOnly && (
        <div className="hidden sm:block px-4 pt-4">
          <Button variant="primary" className="w-full" disabled={pickCount < categories.length} onClick={() => setShowConfirm(true)}>
            {isEdit ? `Update Picks (${pickCount}/${categories.length})` : `Submit Picks (${pickCount}/${categories.length})`}
          </Button>
        </div>
      )}

      {/* Mobile summary bar */}
      {!readOnly && (
        <SummaryBar
          totalCategories={categories.length}
          pickCount={pickCount}
          onSubmit={() => setShowConfirm(true)}
          submitting={submitting}
          isEdit={isEdit}
        />
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          picks={picksForConfirm}
          poolName={pool.name}
          isEdit={isEdit}
          submitting={submitting}
          error={submitError}
          onConfirm={handleSubmit}
          onCancel={() => { setShowConfirm(false); setSubmitError(null); }}
          onDismissError={() => setSubmitError(null)}
        />
      )}
    </div>
  );
}

function StatusMsg({ msg }: { msg: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-sm text-green-600">{msg}</p>
    </div>
  );
}
