"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LeaderboardList } from "./_components/LeaderboardList";
import type { LeaderboardEntry } from "./_components/LeaderboardList";
import { StatusBanner } from "./_components/StatusBanner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Confetti } from "./_components/Confetti";
import { WinnerCelebration } from "./_components/WinnerCelebration";
import { ResultCard } from "./_components/ResultCard";
import { StaleFooter } from "./_components/StaleFooter";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface LeaderboardData {
  pool: {
    id: string;
    name: string;
    status: string;
    maxEntries: number;
    picksDeadline: string;
    inviteCode: string;
    scoringConfig: {
      scoringType: string;
      rosterRule: string;
    };
  };
  tournament: {
    name: string;
    status: string;
    lastSyncAt: string | null;
    currentRound: number | null;
  };
  templateName: string;
  onCourse: number;
  pendingReplacements: number;
  entries: LeaderboardEntry[];
  rosterRuleSummary: string | null;
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
  if (error) return <div className="mx-auto max-w-leaderboard px-4 py-12 text-center font-sans text-accent-danger">{error}</div>;
  if (!data) return null;

  const { pool, tournament, entries, rosterRuleSummary, templateName } = data;
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const isComplete = pool.status === "COMPLETE";
  const winner = entries.length > 0 && entries[0].position === 1 && isComplete ? entries[0] : null;

  // Build status display string
  const statusDisplay = pool.status === "LIVE" && tournament.currentRound
    ? `LIVE · R${tournament.currentRound}`
    : pool.status;

  return (
    <div className="mx-auto max-w-leaderboard px-4 py-4">
      {/* Header bar */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-semibold text-text-primary truncate">
            {tournament.name}
          </p>
          <p className="font-sans text-xs text-text-secondary mt-0.5">
            {pool.name} — {templateName}
          </p>
        </div>
        <div className="shrink-0 ml-3">
          <StatusBadge status={statusDisplay} />
        </div>
      </div>

      {/* Status banner (picks open, locked, etc.) */}
      <div className="mb-3">
        <StatusBanner
          poolId={pool.id}
          poolStatus={pool.status}
          picksDeadline={pool.picksDeadline}
          tournamentName={tournament.name}
          lastSyncAt={tournament.lastSyncAt}
          hasEntry={entries.some((e) => e.isCurrentUser)}
        />
      </div>

      {/* Winner celebration — COMPLETE only */}
      {isComplete && winner && (
        <>
          <Confetti poolId={pool.id} />
          <WinnerCelebration
            winnerName={winner.teamName}
            poolName={pool.name}
            tournamentName={tournament.name}
            winnerScore={winner.total}
          />
        </>
      )}

      {/* Leaderboard table */}
      <LeaderboardList
        entries={entries}
        hasScores={hasScores}
        expanded={expanded}
        onToggle={(id) => setExpanded(expanded === id ? null : id)}
        rosterRuleSummary={rosterRuleSummary}
        entryCount={entries.length}
        tournamentName={tournament.name}
      />

      {/* Share Results — COMPLETE only */}
      {isComplete && entries.length > 0 && (
        <ResultCard
          poolName={pool.name}
          tournamentName={tournament.name}
          top5={entries.slice(0, 5).map((e) => ({
            displayName: e.teamName,
            teamName: e.teamName,
            teamScore: e.total,
            rank: e.position,
          }))}
          allRanks={entries.map((e) => e.position)}
        />
      )}

      <StaleFooter lastSyncAt={tournament.lastSyncAt} hasScores={hasScores} />

      {/* Expand animation keyframes */}
      <style jsx global>{`
        @keyframes expandIn {
          from { max-height: 0; opacity: 0; }
          to { max-height: 1000px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
