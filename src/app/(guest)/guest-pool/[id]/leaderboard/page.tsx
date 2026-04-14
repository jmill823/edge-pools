"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LeaderboardList } from "@/app/(app)/pool/[id]/leaderboard/_components/LeaderboardList";
import type { LeaderboardEntry } from "@/app/(app)/pool/[id]/leaderboard/_components/LeaderboardList";
import { StatusBanner } from "@/app/(app)/pool/[id]/leaderboard/_components/StatusBanner";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Confetti } from "@/app/(app)/pool/[id]/leaderboard/_components/Confetti";
import { WinnerCelebration } from "@/app/(app)/pool/[id]/leaderboard/_components/WinnerCelebration";
import { StaleFooter } from "@/app/(app)/pool/[id]/leaderboard/_components/StaleFooter";
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
  entries: LeaderboardEntry[];
  rosterRuleSummary: string | null;
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
  if (error) return <div className="mx-auto max-w-leaderboard px-4 py-12 text-center font-sans text-accent-danger">{error}</div>;
  if (!data) return null;

  const { pool, tournament, entries, rosterRuleSummary } = data;
  const hasScores = ["LIVE", "COMPLETE", "ARCHIVED"].includes(pool.status);
  const isComplete = pool.status === "COMPLETE";
  const winner = entries.length > 0 && entries[0].position === 1 && isComplete ? entries[0] : null;

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
            {pool.name}
          </p>
        </div>
        <div className="shrink-0 ml-3">
          <StatusBadge status={statusDisplay} />
        </div>
      </div>

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

      {/* Same LeaderboardList component as authenticated users */}
      <LeaderboardList
        entries={entries}
        hasScores={hasScores}
        expanded={expanded}
        onToggle={(id) => setExpanded(expanded === id ? null : id)}
        rosterRuleSummary={rosterRuleSummary}
        entryCount={entries.length}
        tournamentName={tournament.name}
      />

      <StaleFooter lastSyncAt={tournament.lastSyncAt} hasScores={hasScores} />

      {/* Guest CTA */}
      <div className="mt-6 text-center">
        <a
          href={`/join/${pool.inviteCode}`}
          className="inline-block rounded-[8px] px-6 py-3 font-sans text-sm font-semibold text-white min-h-[44px]"
          style={{ background: "linear-gradient(135deg, #5A8A5E, #4A7A4E)" }}
        >
          Join this pool
        </a>
      </div>

      <style jsx global>{`
        @keyframes expandIn {
          from { max-height: 0; opacity: 0; }
          to { max-height: 1000px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
