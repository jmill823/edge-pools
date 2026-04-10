"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBanner } from "@/app/(app)/pool/[id]/leaderboard/_components/StatusBanner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Confetti } from "@/app/(app)/pool/[id]/leaderboard/_components/Confetti";
import { WinnerCelebration } from "@/app/(app)/pool/[id]/leaderboard/_components/WinnerCelebration";
import { StaleFooter } from "@/app/(app)/pool/[id]/leaderboard/_components/StaleFooter";
import { formatScore, scoreColor, formatRankWithTies } from "@/app/(app)/pool/[id]/leaderboard/_components/score-utils";

interface PickDetail {
  golferId: string;
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
  userId: string | null;
  guestPlayerId: string | null;
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

export default function GuestLeaderboardPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isInitial = false) => {
    try {
      const r = await fetch(`/api/pools/${params.id}/guest/leaderboard`);
      if (!r.ok) throw new Error("Failed to load leaderboard");
      const d = await r.json();
      setData(d);
      if (isInitial) setLoading(false);
    } catch (e) {
      if (isInitial) { setError((e as Error).message); setLoading(false); }
    }
  }, [params.id]);

  useEffect(() => { load(true); }, [load]);

  useEffect(() => {
    if (!data || data.pool.status !== "LIVE") return;
    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => load(), 30000);
    }
    function handleVisibility() {
      if (document.hidden) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else { load(); startPolling(); }
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

  const { pool, tournament, leaderboard } = data;
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const isComplete = pool.status === "COMPLETE";
  const myEntry = leaderboard.find((e) => e.isCurrentUser);
  const allRanks = leaderboard.map((e) => e.rank);
  const winner = leaderboard.length > 0 && leaderboard[0].rank === 1 && isComplete ? leaderboard[0] : null;

  return (
    <div className="mx-auto max-w-leaderboard px-4 py-4">
      <div className="mb-2">
        <h1 className="font-display text-lg font-bold text-text-primary">{pool.name}</h1>
        <p className="font-body text-sm text-text-secondary">{tournament.name}</p>
      </div>

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

      {isComplete && winner && (
        <>
          <Confetti poolId={pool.id} />
          <WinnerCelebration
            winnerName={winner.teamName || winner.displayName}
            poolName={pool.name}
            tournamentName={tournament.name}
            winnerScore={winner.teamScore}
          />
        </>
      )}

      {/* Simple guest leaderboard table */}
      {leaderboard.length === 0 ? (
        <div className="py-12 text-center font-body text-sm text-text-muted">
          No entries yet.
        </div>
      ) : (
        <>
          <div className="flex items-center px-3 py-2 border-b border-border">
            <span className="w-[30px] font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Rank</span>
            <span className="flex-1 font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Team</span>
            <span className="w-[40px] text-right font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Score</span>
          </div>
          {leaderboard.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              className={`w-full flex items-center px-3 py-2.5 text-left border-b border-border/50 min-h-[44px] cursor-pointer ${
                entry.isCurrentUser ? "bg-[#E8F0E5]" : "hover:bg-surface-alt"
              }`}
            >
              <span className="w-[30px] shrink-0 font-mono text-xs font-bold text-[#C4B896]">
                {hasScores ? formatRankWithTies(entry.rank, allRanks) : "\u2014"}
              </span>
              <span className="flex-1 truncate font-body text-sm font-medium text-text-primary">
                {entry.teamName}
              </span>
              <span className={`w-[40px] shrink-0 text-right font-mono text-[13px] font-bold ${hasScores ? scoreColor(entry.teamScore) : "text-text-muted"}`}>
                {hasScores ? formatScore(entry.teamScore) : "\u2014"}
              </span>
            </button>
          ))}
        </>
      )}

      <StaleFooter lastSyncAt={tournament.lastSyncAt} hasScores={hasScores} />
    </div>
  );
}
