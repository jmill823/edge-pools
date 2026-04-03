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
  teamName: string;
  entryNumber: number;
  teamScore: number | null;
  rank: number | null;
  previousRank: number | null;
  isCurrentUser: boolean;
  submittedAt: string;
  winProbability: number | null;
  cutProbability: number | null;
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

  if (loading) return <div className="mx-auto max-w-leaderboard px-4 py-8"><LoadingSkeleton variant="page" lines={6} /></div>;
  if (error) return <div className="mx-auto max-w-leaderboard px-4 py-12 text-center font-body text-accent-danger">{error}</div>;
  if (!data) return null;

  const { pool, tournament, onCourse, leaderboard } = data;
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const myEntry = leaderboard.find((e) => e.isCurrentUser);
  const allRanks = leaderboard.map((e) => e.rank);

  // Stale data calculation
  const staleMinutes = tournament.lastSyncAt
    ? Math.floor((Date.now() - new Date(tournament.lastSyncAt).getTime()) / 60000)
    : null;

  return (
    <div className="mx-auto max-w-leaderboard px-4 py-4">
      {/* Tournament info */}
      <div className="mb-1">
        <p className="font-body text-sm text-text-secondary">
          {tournament.name}
          {tournament.currentRound && hasScores && (
            <span> · Round {tournament.currentRound}{onCourse > 0 && ` — ${onCourse} on course`}</span>
          )}
        </p>
        {hasScores && tournament.lastSyncAt && (
          <p className="font-mono text-xs text-text-muted mt-0.5">
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
            teamName={myEntry.teamName}
            teamScore={myEntry.teamScore}
            entryNumber={myEntry.entryNumber}
            maxEntries={pool.maxEntries}
            allRanks={allRanks}
            picks={myEntry.picks}
            winProbability={myEntry.winProbability}
            cutProbability={myEntry.cutProbability}
            onTap={() => setExpanded(expanded === myEntry.id ? null : myEntry.id)}
          />
        </div>
      )}

      {/* Column headers — always 5 columns when entries exist */}
      {leaderboard.length > 0 && (
        <div className="flex items-center bg-surface-alt px-3 py-2 border-b border-border mb-0.5">
          <span className="w-[30px] font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Rank</span>
          <span className="w-[36px] font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Cut%</span>
          <span className="flex-1 font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Team</span>
          <span className="w-[40px] text-right font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Score</span>
          <span className="w-[44px] text-right font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">%Win</span>
        </div>
      )}

      {/* Entry list */}
      {leaderboard.length > 0 ? (
        <div className="space-y-0.5">
          {leaderboard.map((entry, idx) => (
            <EntryRow
              key={entry.id}
              entryId={entry.id}
              rank={entry.rank}
              previousRank={entry.previousRank}
              teamName={entry.teamName}
              teamScore={entry.teamScore}
              entryNumber={entry.entryNumber}
              maxEntries={pool.maxEntries}
              isCurrentUser={entry.isCurrentUser}
              isExpanded={expanded === entry.id}
              allRanks={allRanks}
              picks={entry.picks}
              hasScores={hasScores}
              submittedAt={entry.submittedAt}
              winProbability={entry.winProbability}
              cutProbability={entry.cutProbability}
              onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
              isEvenRow={idx % 2 === 0}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center font-body text-sm text-text-muted">
          No entries yet. Picks will appear on the leaderboard after submission.
        </div>
      )}

      {/* Stale data footer */}
      {hasScores && staleMinutes !== null && staleMinutes >= 2 && (
        <div className={`mt-4 rounded-data px-3 py-2 text-center font-mono text-xs ${
          staleMinutes > 5 ? "bg-[#FDF4E3] text-[#8A6B1E]" : "bg-surface-alt text-text-muted"
        }`}>
          Updated {staleMinutes} min ago
        </div>
      )}
    </div>
  );
}
