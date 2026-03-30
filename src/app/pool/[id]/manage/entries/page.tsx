"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface EntryPick {
  category: { name: string; sortOrder: number };
  golfer: { name: string; country: string | null; owgr: number | null };
}

interface EntryData {
  id: string;
  entryNumber: number;
  submittedAt: string;
  user: { displayName: string; email: string };
  picks: EntryPick[];
}

export default function OrganizerEntriesPage({
  params,
}: {
  params: { id: string };
}) {
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"time" | "name">("time");

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/pools/${params.id}/entries`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load entries");
        return;
      }
      const data = await res.json();
      setEntries(data.entries);
      setMemberCount(data.memberCount);
      setEntryCount(data.entryCount);
    } catch {
      setError("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">{error}</p>
        </div>
        <div className="mt-6">
          <Link
            href={`/pool/${params.id}/manage`}
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            &larr; Back to Pool Management
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "name")
      return a.user.displayName.localeCompare(b.user.displayName);
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900">All Entries</h1>
      <p className="mt-1 text-sm text-green-600">
        {entryCount} entries from {memberCount} members
      </p>

      {/* Sort controls */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setSortBy("time")}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            sortBy === "time"
              ? "bg-green-800 text-white"
              : "border border-green-300 text-green-700 hover:bg-green-50"
          }`}
        >
          By Time
        </button>
        <button
          onClick={() => setSortBy("name")}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            sortBy === "name"
              ? "bg-green-800 text-white"
              : "border border-green-300 text-green-700 hover:bg-green-50"
          }`}
        >
          By Name
        </button>
      </div>

      {/* Entries list */}
      <div className="mt-4 space-y-2">
        {sorted.map((entry) => {
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
                <div className="min-w-0">
                  <span className="font-medium text-green-900">
                    {entry.user.displayName}
                  </span>
                  <span className="ml-2 text-xs text-green-500">
                    Entry {entry.entryNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-green-500">
                    {new Date(entry.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
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
                  {entry.picks.map((pick, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-green-500">
                        {pick.category.name}
                      </span>
                      <span className="font-medium text-green-900">
                        {pick.golfer.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="mt-4 rounded-lg border border-green-200 p-6 text-center">
          <p className="text-sm text-green-600">No entries submitted yet.</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-green-200">
        <Link
          href={`/pool/${params.id}/manage`}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          &larr; Back to Pool Management
        </Link>
      </div>
    </div>
  );
}
