"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MyEntryCard } from "@/app/(app)/pool/[id]/leaderboard/_components/MyEntryCard";
import { LeaderboardList } from "@/app/(app)/pool/[id]/leaderboard/_components/LeaderboardList";
import { StatusBanner } from "@/app/(app)/pool/[id]/leaderboard/_components/StatusBanner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Confetti } from "@/app/(app)/pool/[id]/leaderboard/_components/Confetti";
import { WinnerCelebration } from "@/app/(app)/pool/[id]/leaderboard/_components/WinnerCelebration";
import { ResultCard } from "@/app/(app)/pool/[id]/leaderboard/_components/ResultCard";
import { StaleFooter } from "@/app/(app)/pool/[id]/leaderboard/_components/StaleFooter";

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
      } else {
        load();
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
  const isComplete = pool.status === "COMPLETE";
  const myEntry = leaderboard.find((e) => e.isCurrentUser);
  const allRanks = leaderboard.map((e) => e.rank);
  const winner = leaderboard.length > 0 && leaderboard[0].rank === 1 ? leaderboard[0] : null;

  return (
    <div className="mx-auto max-w-leaderboard px-4 py-4">
      {/* Pool name for guest context */}
      <div className="mb-2">
        <h1 className="font-display text-lg font-bold text-text-primary">{pool.name}</h1>
      </div>

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

      {/* Winner celebration — COMPLETE only */}
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

      {/* My Entry card */}
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

      {/* Entry list */}
      <LeaderboardList
        poolId={pool.id}
        entries={leaderboard}
        maxEntries={pool.maxEntries}
        hasScores={hasScores}
        isComplete={isComplete}
        currentRound={tournament.currentRound}
        allRanks={allRanks}
        expanded={expanded}
        onToggle={(id) => setExpanded(expanded === id ? null : id)}
      />

      {/* Share Results — COMPLETE only */}
      {isComplete && leaderboard.length > 0 && (
        <ResultCard
          poolName={pool.name}
          tournamentName={tournament.name}
          top5={leaderboard.slice(0, 5).map((e) => ({
            displayName: e.displayName,
            teamName: e.teamName,
            teamScore: e.teamScore,
            rank: e.rank,
          }))}
          allRanks={allRanks}
        />
      )}

      <StaleFooter lastSyncAt={tournament.lastSyncAt} hasScores={hasScores} />
    </div>
  );
}
