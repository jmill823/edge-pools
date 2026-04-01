"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface EntryData {
  id: string;
  entryNumber: number;
  submittedAt: string;
  updatedAt: string;
  picks: {
    category: { id: string; name: string; sortOrder: number };
    golfer: { id: string; name: string; country: string | null; owgr: number | null };
  }[];
}

interface PoolInfo {
  id: string;
  name: string;
  maxEntries: number;
  picksDeadline: string;
  status: string;
  tournament: { name: string };
}

export default function MyEntriesPage({
  params,
}: {
  params: { id: string };
}) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [poolRes, entriesRes] = await Promise.all([
        fetch(`/api/pools/${params.id}`),
        fetch(`/api/pools/${params.id}/entries/mine`),
      ]);

      if (poolRes.ok) {
        const p = await poolRes.json();
        setPool({
          id: p.id,
          name: p.name,
          maxEntries: p.maxEntries,
          picksDeadline: p.picksDeadline,
          status: p.status,
          tournament: p.tournament,
        });
      }

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data);
        if (data.length === 1) setExpandedId(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-red-800">Pool not found</h1>
      </div>
    );
  }

  const isPastDeadline = new Date() > new Date(pool.picksDeadline);
  const canEdit = !isPastDeadline && ["OPEN", "SETUP"].includes(pool.status);
  const canAddMore = canEdit && entries.length < pool.maxEntries;
  const showMulti = pool.maxEntries > 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900">{pool.name}</h1>
      <p className="mt-1 text-sm text-green-600">{pool.tournament.name}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-900">
            {showMulti
              ? `Your Entries (${entries.length}/${pool.maxEntries})`
              : "Your Picks"}
          </h2>
          {canEdit && entries.length > 0 && (
            <Link
              href={`/pool/${params.id}/picks`}
              className="rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            >
              {entries.length > 0 ? "Edit Picks" : "Make Picks"}
            </Link>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="mt-4 rounded-lg border border-green-200 p-6 text-center">
            <p className="text-sm text-green-600">
              {canEdit
                ? "You haven't submitted any picks yet."
                : "You didn't submit picks for this pool."}
            </p>
            {canEdit && (
              <Link
                href={`/pool/${params.id}/picks`}
                className="mt-3 inline-block rounded-md bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-900"
              >
                Make Your Picks
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-green-200 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : entry.id)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <span className="font-medium text-green-900">
                        {showMulti
                          ? `Entry ${entry.entryNumber}`
                          : "Your Picks"}
                      </span>
                      <span className="ml-2 text-xs text-green-500">
                        Submitted{" "}
                        {new Date(entry.submittedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {entry.picks.length} picks
                      </span>
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
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-green-100 px-4 py-3 space-y-1.5">
                      {entry.picks.map((pick) => (
                        <div
                          key={pick.category.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-green-500">
                            {pick.category.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-green-900">
                              {pick.golfer.name}
                            </span>
                            {pick.golfer.owgr && (
                              <span className="text-xs text-green-400">
                                #{pick.golfer.owgr}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canAddMore && showMulti && (
          <Link
            href={`/pool/${params.id}/picks`}
            className="mt-4 block w-full rounded-lg border-2 border-dashed border-green-300 py-3 text-center text-sm font-medium text-green-700 hover:border-green-500"
          >
            + Add Another Entry ({entries.length}/{pool.maxEntries})
          </Link>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-green-200 flex flex-wrap gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          &larr; Dashboard
        </Link>
        <Link
          href={`/pool/${params.id}/leaderboard`}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          Leaderboard
        </Link>
        {canEdit && (
          <Link
            href={`/pool/${params.id}/picks`}
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            {entries.length > 0 ? "Edit Picks" : "Make Picks"}
          </Link>
        )}
      </div>
    </div>
  );
}
