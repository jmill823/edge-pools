"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  golfers: Golfer[];
}

interface PoolInfo {
  id: string;
  name: string;
  status: string;
  maxEntries: number;
  picksDeadline: string;
  tournament: { name: string };
}

interface ExistingEntry {
  id: string;
  entryNumber: number;
  picks: {
    category: { id: string; name: string; sortOrder: number };
    golfer: { id: string; name: string; country: string | null; owgr: number | null };
  }[];
}

export default function PicksPage({
  params,
}: {
  params: { id: string };
}) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingEntries, setExistingEntries] = useState<ExistingEntry[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({}); // categoryId → golferId
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [notMember, setNotMember] = useState(false);
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadData = useCallback(async () => {
    try {
      const [poolRes, catsRes, entriesRes] = await Promise.all([
        fetch(`/api/pools/${params.id}`),
        fetch(`/api/pools/${params.id}/categories`),
        fetch(`/api/pools/${params.id}/entries/mine`),
      ]);

      if (!poolRes.ok) {
        setError("Pool not found");
        setLoading(false);
        return;
      }

      const poolData = await poolRes.json();
      setPool({
        id: poolData.id,
        name: poolData.name,
        status: poolData.status,
        maxEntries: poolData.maxEntries,
        picksDeadline: poolData.picksDeadline,
        tournament: poolData.tournament,
      });

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
        if (catsData.length > 0) setExpandedCat(catsData[0].id);
      } else if (catsRes.status === 403) {
        setNotMember(true);
      }

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setExistingEntries(entriesData);

        // If there's exactly one entry and maxEntries=1, load picks for editing
        if (entriesData.length === 1 && poolData.maxEntries === 1) {
          const entry = entriesData[0];
          setEditingEntryId(entry.id);
          const sel: Record<string, string> = {};
          for (const p of entry.picks) {
            sel[p.category.id] = p.golfer.id;
          }
          setSelections(sel);
        }
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isPastDeadline = pool ? new Date() > new Date(pool.picksDeadline) : false;
  const isLocked = isPastDeadline || (pool && !["OPEN", "SETUP"].includes(pool.status));

  // Selected golfer IDs across all categories for this entry
  const selectedGolferIds = new Set(Object.values(selections));

  const totalCategories = categories.length;
  const pickedCount = Object.keys(selections).length;
  const allPicked = pickedCount === totalCategories && totalCategories > 0;

  function selectGolfer(categoryId: string, golferId: string) {
    if (isLocked) return;

    setSelections((prev) => {
      const next = { ...prev };
      if (next[categoryId] === golferId) {
        delete next[categoryId]; // Deselect
      } else {
        next[categoryId] = golferId;
      }
      return next;
    });

    // Auto-advance to next category
    const catIdx = categories.findIndex((c) => c.id === categoryId);
    if (catIdx < categories.length - 1) {
      const nextCatId = categories[catIdx + 1].id;
      setTimeout(() => {
        setExpandedCat(nextCatId);
        catRefs.current[nextCatId]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }

  function startNewEntry() {
    setSelections({});
    setEditingEntryId(null);
    setExpandedCat(categories[0]?.id || null);
  }

  function editEntry(entry: ExistingEntry) {
    const sel: Record<string, string> = {};
    for (const p of entry.picks) {
      sel[p.category.id] = p.golfer.id;
    }
    setSelections(sel);
    setEditingEntryId(entry.id);
    setExpandedCat(categories[0]?.id || null);
  }

  async function submitPicks() {
    setSubmitting(true);
    setError(null);

    const picks = Object.entries(selections).map(([categoryId, golferId]) => ({
      categoryId,
      golferId,
    }));

    try {
      let res: Response;
      if (editingEntryId) {
        res = await fetch(
          `/api/pools/${params.id}/entries/${editingEntryId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ picks }),
          }
        );
      } else {
        res = await fetch(`/api/pools/${params.id}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ picks }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to submit picks" }));
        setError(data.error || "Failed to submit picks");
        setSubmitting(false);
        setShowConfirm(false);
        return;
      }

      // Show success — no auto-redirect, let user choose next action
      setShowConfirm(false);
      setSubmitSuccess(true);
      // Reload entries so we have updated count for multi-entry
      const updatedEntries = await fetch(`/api/pools/${params.id}/entries/mine`);
      if (updatedEntries.ok) {
        setExistingEntries(await updatedEntries.json());
      }
    } catch {
      setError("Failed to submit picks. Please check your connection and try again.");
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  // Loading / error states
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (notMember && pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-green-900">Not a Member</h1>
        <p className="mt-2 text-sm text-green-600">
          You need to join this pool before making picks.
        </p>
        <Link
          href={`/dashboard`}
          className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-red-800">{error || "Pool not found"}</h1>
      </div>
    );
  }

  // Post-deadline: show locked state
  if (isLocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-green-900">{pool.name}</h1>
        <p className="mt-1 text-sm text-green-600">{pool.tournament.name}</p>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-800">Picks Are Locked</h2>
          <p className="mt-1 text-sm text-amber-700">
            The picks deadline was{" "}
            {new Date(pool.picksDeadline).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            .
          </p>
        </div>

        {existingEntries.length > 0 ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-green-900">
              Your Submitted Picks
            </h2>
            {existingEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} categories={categories} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-green-200 p-4 text-center">
            <p className="text-sm text-green-600">
              You didn&apos;t submit picks for this pool.
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-green-200">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Active picking state
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-36">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-green-900">{pool.name}</h1>
        <p className="mt-1 text-sm text-green-600">{pool.tournament.name}</p>
        <Countdown deadline={pool.picksDeadline} />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {submitSuccess && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-green-800">
            Picks saved successfully!
          </p>
          {pool.maxEntries > 1 && existingEntries.length < pool.maxEntries && (
            <p className="mt-1 text-sm text-green-600">
              Entry {existingEntries.length} of {pool.maxEntries} submitted
            </p>
          )}
          {pool.maxEntries > 1 && existingEntries.length >= pool.maxEntries && (
            <p className="mt-1 text-sm text-green-600">
              All {pool.maxEntries} entries submitted
            </p>
          )}
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href={`/pool/${params.id}/leaderboard`}
              className="w-full rounded-md bg-green-800 py-2.5 text-sm font-medium text-white hover:bg-green-900"
            >
              View Leaderboard
            </Link>
            {pool.maxEntries > 1 && existingEntries.length < pool.maxEntries && (
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  startNewEntry();
                }}
                className="w-full rounded-md border-2 border-green-600 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                Add Another Entry ({existingEntries.length + 1} of {pool.maxEntries})
              </button>
            )}
            <Link
              href={`/pool/${params.id}/my-entries`}
              className="w-full rounded-md border border-green-300 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              View My Entries
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-green-600 hover:text-green-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Show existing entries if multi-entry and not currently editing */}
      {!submitSuccess && pool.maxEntries > 1 && existingEntries.length > 0 && !editingEntryId && Object.keys(selections).length === 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-green-900">
            Your Entries ({existingEntries.length}/{pool.maxEntries})
          </h2>
          {existingEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-green-200 p-3"
            >
              <span className="text-sm font-medium text-green-900">
                Entry {entry.entryNumber}
              </span>
              <button
                onClick={() => editEntry(entry)}
                className="rounded border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
              >
                Edit Picks
              </button>
            </div>
          ))}
          {existingEntries.length < pool.maxEntries && (
            <button
              onClick={startNewEntry}
              className="w-full rounded-lg border-2 border-dashed border-green-300 py-3 text-sm font-medium text-green-700 hover:border-green-500"
            >
              + Add Another Entry
            </button>
          )}
          <Link
            href={`/pool/${params.id}/my-entries`}
            className="block text-center text-sm font-medium text-green-700 hover:text-green-900"
          >
            View All Entries
          </Link>
        </div>
      )}

      {/* Category accordion */}
      {!submitSuccess && (editingEntryId || Object.keys(selections).length > 0 || existingEntries.length === 0 || (pool.maxEntries === 1 && existingEntries.length === 0)) && (
        <>
          {editingEntryId && pool.maxEntries > 1 && (
            <p className="mt-4 text-sm text-green-600">
              Editing Entry {existingEntries.find((e) => e.id === editingEntryId)?.entryNumber}
            </p>
          )}

          <div className="mt-6 space-y-2">
            {categories.map((cat) => {
              const selectedGolferId = selections[cat.id];
              const selectedGolfer = cat.golfers.find(
                (g) => g.id === selectedGolferId
              );
              const isExpanded = expandedCat === cat.id;

              return (
                <div
                  key={cat.id}
                  ref={(el) => { catRefs.current[cat.id] = el; }}
                  className="rounded-lg border border-green-200 bg-white overflow-hidden"
                >
                  {/* Category header — sticky so it stays visible while scrolling */}
                  <button
                    onClick={() =>
                      setExpandedCat(isExpanded ? null : cat.id)
                    }
                    className="sticky top-0 z-10 flex w-full items-center gap-3 px-4 py-3 text-left bg-white border-b border-green-100"
                  >
                    <span className="text-xs font-mono text-green-500 w-5">
                      {cat.sortOrder}
                    </span>
                    <span className="flex-1 font-medium text-green-900 truncate">
                      {cat.name}
                    </span>
                    {selectedGolfer ? (
                      <span className="flex items-center gap-1 text-sm text-green-700">
                        <svg
                          className="h-4 w-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate max-w-[120px]">
                          {selectedGolfer.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-green-400">
                        Pick one
                      </span>
                    )}
                    <svg
                      className={`h-4 w-4 text-green-500 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Golfer list */}
                  {isExpanded && (
                    <div className="border-t border-green-100">
                      {cat.golfers.map((golfer) => {
                        const isSelected = selections[cat.id] === golfer.id;
                        const isPickedElsewhere =
                          !isSelected &&
                          selectedGolferIds.has(golfer.id);

                        return (
                          <button
                            key={golfer.id}
                            onClick={() => {
                              if (!isPickedElsewhere) {
                                selectGolfer(cat.id, golfer.id);
                              }
                            }}
                            disabled={isPickedElsewhere}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors min-h-[44px] ${
                              isSelected
                                ? "bg-green-100 border-l-4 border-green-600"
                                : isPickedElsewhere
                                ? "bg-gray-50 opacity-50 cursor-not-allowed"
                                : "hover:bg-green-50"
                            }`}
                          >
                            {/* Selection indicator */}
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-green-600 bg-green-600"
                                  : "border-green-300"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>

                            <span
                              className={`flex-1 text-sm ${
                                isSelected
                                  ? "font-semibold text-green-900"
                                  : isPickedElsewhere
                                  ? "text-gray-400"
                                  : "text-green-900"
                              }`}
                            >
                              {golfer.name}
                            </span>

                            {golfer.country && (
                              <span className="text-xs text-green-500">
                                {golfer.country}
                              </span>
                            )}
                            {golfer.owgr && (
                              <span className="text-xs text-green-400">
                                #{golfer.owgr}
                              </span>
                            )}
                            {isPickedElsewhere && (
                              <span className="text-xs text-gray-400">
                                (Already picked)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sticky bottom bar */}
      {!submitSuccess && (editingEntryId || Object.keys(selections).length > 0 || existingEntries.length === 0) && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-green-200 bg-white px-4 py-3 shadow-lg z-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-900">
                  {pickedCount} of {totalCategories} picks made
                </p>
                <div className="mt-1 h-1.5 w-32 rounded-full bg-green-100">
                  <div
                    className="h-1.5 rounded-full bg-green-600 transition-all"
                    style={{
                      width: `${
                        totalCategories > 0
                          ? (pickedCount / totalCategories) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!allPicked}
                className="rounded-md bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-40"
              >
                {editingEntryId ? "Save Picks" : "Submit Picks"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-t-xl sm:rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-green-900">
              {editingEntryId ? "Save Your Picks?" : "Confirm Your Picks"}
            </h2>
            {error && (
              <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}
            <div className="mt-4 space-y-2">
              {categories.map((cat) => {
                const golfer = cat.golfers.find(
                  (g) => g.id === selections[cat.id]
                );
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded border border-green-100 px-3 py-2"
                  >
                    <span className="text-xs text-green-500 uppercase tracking-wide">
                      {cat.name}
                    </span>
                    <span className="text-sm font-medium text-green-900">
                      {golfer?.name || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={submitPicks}
                disabled={submitting}
                className="flex-1 rounded-md bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-md border border-green-300 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav footer (above sticky bar) */}
      {!submitSuccess && (
        <div className="mt-8 pt-4 border-t border-green-200">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

/** Countdown timer component */
function Countdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return (
    <p className="mt-2 text-xs text-amber-600 font-medium">
      ⏰ Picks lock in {parts.join(" ")}
    </p>
  );
}

/** Read-only entry card for locked state */
function EntryCard({
  entry,
  categories,
}: {
  entry: ExistingEntry;
  categories: Category[];
}) {
  return (
    <div className="rounded-lg border border-green-200 p-4">
      <h3 className="text-sm font-semibold text-green-900">
        Entry {entry.entryNumber}
      </h3>
      <div className="mt-2 space-y-1">
        {categories.map((cat) => {
          const pick = entry.picks.find((p) => p.category.id === cat.id);
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-green-500">{cat.name}</span>
              <span className="font-medium text-green-900">
                {pick?.golfer.name || "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
