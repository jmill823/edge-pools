"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MyEntryCard } from "./_components/MyEntryCard";
import { EntryRow } from "./_components/EntryRow";
import { StatusBanner } from "./_components/StatusBanner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

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
  submittedAt: string;
  picks: PickDetail[];
}

interface LeaderboardData {
  pool: { id: string; name: string; status: string; maxEntries: number; picksDeadline: string; inviteCode: string };
  tournament: { name: string; status: string; lastSyncAt: string | null; currentRound: number | null };
  onCourse: number;
  pendingReplacements: number;
  leaderboard: LeaderboardEntry[];
}

export default function LeaderboardPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isInitial = false) => {
    try {
      const r = await fetch(`/api/pools/${params.id}/leaderboard`);
      if (!r.ok) throw new Error("Failed to load leaderboard");
      const d = await r.json();
      setData(d);
      if (isInitial) setLoading(false);
    } catch (e) {
      if (isInitial) { setError((e as Error).message); setLoading(false); }
    }
  }, [params.id]);

  // Initial load
  useEffect(() => { load(true); }, [load]);

  // Polling: 30s when LIVE, pause when tab hidden
  useEffect(() => {
    if (!data || data.pool.status !== "LIVE") return;

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => load(), 30000);
    }

    function handleVisibility() {
      if (document.hidden) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else {
        load(); // Refresh immediately when tab comes back
        startPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pool.status, load]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><LoadingSkeleton variant="page" lines={6} /></div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-red-600">{error}</div>;
  if (!data) return null;

  const { pool, tournament, onCourse, leaderboard } = data;
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const myEntry = leaderboard.find((e) => e.isCurrentUser);
  const allRanks = leaderboard.map((e) => e.rank);

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      {/* Tournament info */}
      <div className="mb-1">
        <p className="text-sm text-green-600">
          {tournament.name}
          {tournament.currentRound && hasScores && (
            <span> · Round {tournament.currentRound}{onCourse > 0 && ` — ${onCourse} on course`}</span>
          )}
        </p>
        {hasScores && tournament.lastSyncAt && (
          <p className="text-xs text-green-500 mt-0.5">
            Updated {new Date(tournament.lastSyncAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Status banner */}
      <div className="mb-4">
        <StatusBanner
          poolId={pool.id}
          poolStatus={pool.status}
          picksDeadline={pool.picksDeadline}
          tournamentName={tournament.name}
          lastSyncAt={tournament.lastSyncAt}
          hasEntry={!!myEntry}
        />
      </div>

      {/* My Entry card — only in scored states */}
      {hasScores && myEntry && (
        <div className="mb-4">
          <MyEntryCard
            rank={myEntry.rank}
            displayName={myEntry.displayName}
            teamScore={myEntry.teamScore}
            entryNumber={myEntry.entryNumber}
            maxEntries={pool.maxEntries}
            allRanks={allRanks}
            onTap={() => setExpanded(expanded === myEntry.id ? null : myEntry.id)}
          />
        </div>
      )}

      {/* Entry list */}
      {leaderboard.length > 0 ? (
        <div className="space-y-0.5">
          {leaderboard.map((entry) => (
            <EntryRow
              key={entry.id}
              entryId={entry.id}
              rank={entry.rank}
              displayName={entry.displayName}
              teamScore={entry.teamScore}
              entryNumber={entry.entryNumber}
              maxEntries={pool.maxEntries}
              isCurrentUser={entry.isCurrentUser}
              isExpanded={expanded === entry.id}
              allRanks={allRanks}
              picks={entry.picks}
              hasScores={hasScores}
              submittedAt={entry.submittedAt}
              onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-green-500">
          No entries yet. Picks will appear on the leaderboard after submission.
        </div>
      )}
    </div>
  );
}
