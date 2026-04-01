"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface PickDetail {
  categoryName: string;
  golferName: string;
  golferCountry: string | null;
  golferScore: number | null;
  golferPosition: string | null;
  holesCompleted: number;
  round: number;
  isReplacement: boolean;
  originalGolferName: string | null;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  entryNumber: number;
  teamScore: number | null;
  rank: number | null;
  previousRank: number | null;
  isCurrentUser: boolean;
  picks: PickDetail[];
}

interface LeaderboardData {
  pool: { id: string; name: string; status: string; maxEntries: number };
  tournament: {
    name: string;
    status: string;
    lastSyncAt: string | null;
    currentRound: number | null;
  };
  onCourse: number;
  pendingReplacements: number;
  leaderboard: LeaderboardEntry[];
}

export default function LeaderboardPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/pools/${params.id}/leaderboard`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load leaderboard");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    load();
    // Poll every 30 seconds when tournament is live
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard" className="mt-4 text-sm text-green-700 underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-green-600">
        Loading leaderboard...
      </div>
    );
  }

  const { pool, tournament, onCourse, leaderboard } = data;
  const myEntry = leaderboard.find((e) => e.isCurrentUser);
  const staleMinutes = tournament.lastSyncAt
    ? Math.floor(
        (Date.now() - new Date(tournament.lastSyncAt).getTime()) / 60000
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-xl font-bold text-green-900">{pool.name}</h1>
        <p className="text-sm text-green-600">
          {tournament.name}
          {tournament.currentRound && (
            <span>
              {" "}
              · Round {tournament.currentRound}
              {onCourse > 0 && ` — ${onCourse} golfers on course`}
            </span>
          )}
        </p>
      </div>

      {/* Stale warning */}
      {tournament.status === "LIVE" && staleMinutes !== null && staleMinutes > 15 && (
        <div
          className={`mb-4 rounded px-3 py-2 text-xs ${
            staleMinutes > 30
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          ⏳ Scores may be delayed. Last updated {staleMinutes} minutes ago.
        </div>
      )}

      {/* Last updated */}
      {tournament.lastSyncAt && (
        <p className="mb-4 text-xs text-green-500">
          Last updated:{" "}
          {new Date(tournament.lastSyncAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* My Entry — pinned */}
      {myEntry && (
        <div className="mb-4 rounded-lg border-2 border-green-400 bg-green-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-green-600">
                Your Position
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-900">
                  {formatRank(myEntry.rank, leaderboard)}
                </span>
                <span className="text-sm text-green-700">
                  {myEntry.displayName}
                  {pool.maxEntries > 1 && ` · Entry ${myEntry.entryNumber}`}
                </span>
              </div>
            </div>
            <span className="text-2xl font-bold text-green-900">
              {formatScore(myEntry.teamScore)}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-0.5">
        {leaderboard.map((entry) => (
          <div key={entry.id}>
            <button
              onClick={() =>
                setExpanded(expanded === entry.id ? null : entry.id)
              }
              className={`w-full flex items-center justify-between px-3 py-3 text-left transition rounded ${
                entry.isCurrentUser
                  ? "bg-green-50 border border-green-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 text-right text-sm font-bold text-green-900 shrink-0">
                  {formatRank(entry.rank, leaderboard)}
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-green-900 truncate">
                    {entry.displayName}
                    {pool.maxEntries > 1 && (
                      <span className="text-green-500">
                        {" "}
                        · E{entry.entryNumber}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-green-900">
                  {formatScore(entry.teamScore)}
                </span>
                <svg
                  className={`h-4 w-4 text-green-400 transition ${
                    expanded === entry.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Expanded picks */}
            {expanded === entry.id && (
              <div className="ml-11 mb-2 rounded-b border-l-2 border-green-200 pl-3 py-2 space-y-1.5">
                {entry.picks.map((pick, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="text-green-500">
                        {pick.categoryName}
                      </span>
                      <span className="mx-1 text-green-300">→</span>
                      <span
                        className={`font-medium ${
                          pick.golferPosition === "CUT" ||
                          pick.golferPosition === "WD"
                            ? "text-red-500"
                            : "text-green-900"
                        }`}
                      >
                        {pick.golferName}
                      </span>
                      {pick.isReplacement && pick.originalGolferName && (
                        <span className="ml-1 text-red-400">
                          (replaced{" "}
                          <span className="line-through">
                            {pick.originalGolferName}
                          </span>
                          )
                        </span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 ml-2 font-mono font-medium ${
                        pick.golferPosition === "CUT" ||
                        pick.golferPosition === "WD"
                          ? "text-red-500"
                          : "text-green-900"
                      }`}
                    >
                      {pick.golferPosition === "CUT"
                        ? "CUT"
                        : pick.golferPosition === "WD"
                          ? "WD"
                          : pick.golferScore !== null
                            ? formatScore(pick.golferScore)
                            : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="py-12 text-center text-sm text-green-500">
          No entries yet. Picks will appear on the leaderboard after submission.
        </div>
      )}

      {leaderboard.length > 0 && (pool.status === "OPEN" || pool.status === "SETUP") && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">
            Waiting for tournament to start
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Scores will update automatically once the tournament begins.
          </p>
        </div>
      )}

      {leaderboard.length > 0 && pool.status === "LOCKED" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">
            Picks are locked — tournament starts soon
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Scores will update automatically once the tournament begins.
          </p>
        </div>
      )}

      {leaderboard.length > 0 && pool.status === "LIVE" && !tournament.lastSyncAt && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-sm font-medium text-green-800">
            Tournament is live — waiting for first score update
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 pt-4 border-t border-green-200 flex gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          ← Dashboard
        </Link>
        <Link
          href={`/pool/${params.id}/my-entries`}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          My Entries
        </Link>
      </div>
    </div>
  );
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "E";
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function formatRank(
  rank: number | null | undefined,
  leaderboard: LeaderboardEntry[]
): string {
  if (!rank) return "—";
  // Check if it's a tie
  const sameRank = leaderboard.filter((e) => e.rank === rank);
  if (sameRank.length > 1) return `T${rank}`;
  return `${rank}`;
}
