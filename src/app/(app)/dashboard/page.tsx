"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PoolItem {
  id: string;
  name: string;
  status: string;
  picksDeadline: string;
  maxEntries: number;
  memberCount: number;
  entryCount: number;
  hasSubmittedPicks: boolean;
  isOrganizer: boolean;
  myBestRank: number | null;
  myBestScore: number | null;
  picksSubmitted: number;
  unpaidCount: number;
  winnerName: string | null;
  winnerScore: number | null;
  tournament: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    currentRound?: number;
  };
  updatedAt: string;
}

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0, OPEN: 1, LOCKED: 2, SETUP: 3, COMPLETE: 4, ARCHIVED: 5,
};

const STRIP_COLORS: Record<string, string> = {
  SETUP: "#E5E7EB",
  OPEN: "#FEF3C7",
  LOCKED: "#E5E7EB",
  LIVE: "#FEE2E2",
  COMPLETE: "#D1FAE5",
  ARCHIVED: "#E5E7EB",
};

export default function DashboardPage() {
  const router = useRouter();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a: PoolItem, b: PoolItem) => {
          const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          if (orderDiff !== 0) return orderDiff;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setPools(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const commissionerPools = pools.filter((p) => p.isOrganizer && p.status !== "ARCHIVED");
  const playerPools = pools.filter((p) => !p.isOrganizer && p.status !== "ARCHIVED");
  const archivedPools = pools.filter((p) => p.status === "ARCHIVED");
  const hasAnyPools = pools.length > 0;

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) router.push(`/join/${joinCode.trim()}`);
  }

  if (loading) return null;

  // Empty state
  if (!hasAnyPools) {
    return (
      <div className="mx-auto max-w-content px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-sans text-[14px] text-[#6B6560] max-w-[280px]">
            Create your first pool or join one with an invite link.
          </p>
          <div className="flex gap-2 mt-6">
            <Link href="/dashboard/create">
              <button className="rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium px-5 py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer min-h-[44px]">
                Create a pool
              </button>
            </Link>
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[13px] font-medium px-5 py-2.5 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[44px]"
            >
              Join a pool
            </button>
          </div>
          {showJoin && (
            <form onSubmit={handleJoin} className="flex gap-2 mt-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Invite code"
                maxLength={8}
                autoFocus
                className="rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-mono text-sm tracking-widest text-center focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 w-[130px] min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[13px] font-medium px-4 py-2.5 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[44px] disabled:opacity-40"
              >
                Go
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* B. Title row */}
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[18px] font-medium text-[#1A1A18]">
          My pools
        </h1>
        <div className="flex gap-2">
          <Link href="/dashboard/create">
            <button className="rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[11px] font-medium px-3 py-1.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer min-h-[32px]">
              Create
            </button>
          </Link>
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[11px] font-medium px-3 py-1.5 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[32px]"
          >
            Join
          </button>
        </div>
      </div>

      {/* Join code input (toggled) */}
      {showJoin && (
        <form onSubmit={handleJoin} className="flex gap-2 mt-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Invite code"
            maxLength={8}
            autoFocus
            className="flex-1 rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-mono text-sm tracking-widest text-center focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium px-5 py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer min-h-[44px] disabled:opacity-40"
          >
            Join
          </button>
        </form>
      )}

      {/* C. Commissioner Pools */}
      {commissionerPools.length > 0 && (
        <section className="mt-5">
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-2">
            My pools
          </p>
          <div className="grid grid-cols-2 gap-2">
            {commissionerPools.map((p) => (
              <PoolCard key={p.id} pool={p} variant="commissioner" />
            ))}
          </div>
        </section>
      )}

      {/* D. Player Pools */}
      {playerPools.length > 0 && (
        <section className="mt-5">
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-2">
            Pools I&apos;m in
          </p>
          <div className="grid grid-cols-2 gap-2">
            {playerPools.map((p) => (
              <PoolCard key={p.id} pool={p} variant="player" />
            ))}
          </div>
        </section>
      )}

      {/* E. Past Pools */}
      {archivedPools.length > 0 && (
        <section className="mt-5">
          <button
            onClick={() => setPastOpen(!pastOpen)}
            className="flex items-center gap-1.5 cursor-pointer w-full"
          >
            <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">
              Past pools
            </p>
            <svg
              className={`h-3 w-3 text-[#A39E96] transition-transform duration-200 ${pastOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-sans text-[10px] text-[#A39E96]">({archivedPools.length})</span>
          </button>
          {pastOpen && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {archivedPools.map((p) => (
                <PoolCard key={p.id} pool={p} variant={p.isOrganizer ? "commissioner" : "player"} archived />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ─── Pool Card ─── */

function PoolCard({
  pool,
  variant,
  archived,
}: {
  pool: PoolItem;
  variant: "commissioner" | "player";
  archived?: boolean;
}) {
  const isCommissioner = variant === "commissioner";
  const href = isCommissioner ? `/pool/${pool.id}/manage` : `/pool/${pool.id}`;
  const stripColor = archived ? "#E5E7EB" : (STRIP_COLORS[pool.status] || "#E5E7EB");

  // Tournament date display
  const start = new Date(pool.tournament.startDate);
  const end = new Date(pool.tournament.endDate);
  const dateStr = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.getDate()}`;

  return (
    <Link href={href} className="block cursor-pointer">
      <div className={`bg-white border border-[#E2DDD5] rounded-[6px] overflow-hidden hover:border-[#1B5E3B]/40 transition-colors duration-200 ${archived ? "opacity-60" : ""}`}>
        {/* Status color strip */}
        <div style={{ height: "4px", backgroundColor: stripColor }} />

        {/* Card content */}
        <div className="p-[10px]">
          {/* Top row: badge + gear */}
          <div className="flex items-center justify-between mb-1">
            <StatusBadge status={pool.status} />
            {isCommissioner && !archived && (
              <svg className="h-[14px] w-[14px] text-[#A39E96] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>

          {/* Pool name */}
          <p className="font-sans text-[13px] font-medium text-[#1A1A18] truncate leading-tight">
            {pool.name}
          </p>

          {/* Tournament + dates */}
          <p className="font-sans text-[9px] text-[#A39E96] truncate mt-0.5">
            {pool.tournament.name} · {dateStr}
          </p>

          {/* Status-specific metrics */}
          <div className="mt-2">
            {isCommissioner ? (
              <CommissionerMetrics pool={pool} />
            ) : (
              <PlayerMetrics pool={pool} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Commissioner Metrics ─── */

function CommissionerMetrics({ pool }: { pool: PoolItem }) {
  switch (pool.status) {
    case "SETUP":
      return (
        <p className="font-sans text-[11px] font-medium text-[#8A6B1E]">
          Finish setup →
        </p>
      );
    case "OPEN":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-[#6B6560]">
            {pool.picksSubmitted}/{pool.entryCount || pool.memberCount} picked
          </span>
          {pool.unpaidCount > 0 && (
            <span className="font-mono text-[11px] text-[#A3342D]">
              {pool.unpaidCount} unpaid
            </span>
          )}
        </div>
      );
    case "LOCKED":
      return (
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-[#6B6560]">All locked</span>
          <span className="font-mono text-[11px] text-[#A39E96]">
            {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      );
    case "LIVE":
      return (
        <div className="flex items-center gap-2">
          {pool.myBestRank !== null && (
            <span className="font-mono text-[16px] font-bold text-[#1A1A18]">
              T{pool.myBestRank}{pool.myBestRank <= 3 ? ordSuffix(pool.myBestRank) : ""}
            </span>
          )}
          <span className="font-mono text-[11px] text-[#A39E96]">
            {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      );
    case "COMPLETE":
      return (
        <div>
          {pool.winnerName && (
            <p className="font-sans text-[11px] font-medium text-[#1A1A18] truncate">
              🏆 {pool.winnerName}
            </p>
          )}
          {pool.winnerScore !== null && (
            <p className="font-mono text-[11px] text-[#6B6560]">
              {formatScore(pool.winnerScore)}
            </p>
          )}
        </div>
      );
    case "ARCHIVED":
      return (
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-[#A39E96]">Archived</span>
          <span className="font-mono text-[11px] text-[#A39E96]">
            {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      );
    default:
      return null;
  }
}

/* ─── Player Metrics ─── */

function PlayerMetrics({ pool }: { pool: PoolItem }) {
  switch (pool.status) {
    case "OPEN": {
      const d = new Date(pool.picksDeadline);
      const deadlineStr = isNaN(d.getTime())
        ? "—"
        : `Picks due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      return (
        <p className="font-sans text-[11px] text-[#8A6B1E]">
          {deadlineStr}
        </p>
      );
    }
    case "LOCKED":
      return (
        <p className="font-sans text-[11px] text-[#6B6560]">
          Waiting for {pool.tournament.name}
        </p>
      );
    case "LIVE":
      return (
        <div className="flex items-baseline gap-1.5">
          {pool.myBestRank !== null ? (
            <>
              <span className="font-mono text-[16px] font-bold text-[#1A1A18]">
                {ordPosition(pool.myBestRank)}
              </span>
              <span className="font-mono text-[11px] text-[#A39E96]">
                / {pool.entryCount}
              </span>
            </>
          ) : (
            <span className="font-sans text-[11px] text-[#A39E96]">No entries</span>
          )}
          {pool.myBestScore !== null && (
            <span className="font-mono text-[11px] text-[#6B6560] ml-1">
              {formatScore(pool.myBestScore)}
            </span>
          )}
        </div>
      );
    case "COMPLETE":
      return (
        <div className="flex items-baseline gap-1.5">
          {pool.myBestRank !== null ? (
            <>
              {pool.myBestRank === 1 ? (
                <span className="font-sans text-[11px] font-medium text-[#1A1A18]">
                  Winner! 🏆
                </span>
              ) : (
                <span className="font-sans text-[11px] text-[#6B6560]">
                  {ordPosition(pool.myBestRank)} place
                </span>
              )}
              {pool.myBestScore !== null && (
                <span className="font-mono text-[11px] text-[#A39E96] ml-1">
                  {formatScore(pool.myBestScore)}
                </span>
              )}
            </>
          ) : (
            <span className="font-sans text-[11px] text-[#A39E96]">—</span>
          )}
        </div>
      );
    case "ARCHIVED":
      return (
        <span className="font-sans text-[11px] text-[#A39E96]">
          {pool.myBestRank ? `${ordPosition(pool.myBestRank)} place` : "—"}
        </span>
      );
    default:
      return null;
  }
}

/* ─── Helpers ─── */

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  if (score === 0) return "E";
  return `${score}`;
}

function ordSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function ordPosition(n: number): string {
  return `${n}${ordSuffix(n)}`;
}
