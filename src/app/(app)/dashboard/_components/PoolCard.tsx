"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface PoolItem {
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

const STRIP_COLORS: Record<string, string> = {
  SETUP: "#E5E7EB",
  OPEN: "#FEF3C7",
  LOCKED: "#E5E7EB",
  LIVE: "#FEE2E2",
  COMPLETE: "#D1FAE5",
  ARCHIVED: "#E5E7EB",
};

export function PoolCard({
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

  const start = new Date(pool.tournament.startDate);
  const end = new Date(pool.tournament.endDate);
  const dateStr = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.getDate()}`;

  return (
    <Link href={href} className="block cursor-pointer">
      <div className={`bg-white border border-[#E2DDD5] rounded-[6px] overflow-hidden hover:border-[#1B5E3B]/40 transition-colors duration-200 ${archived ? "opacity-60" : ""}`}>
        <div style={{ height: "4px", backgroundColor: stripColor }} />
        <div className="p-[10px]">
          <div className="flex items-center justify-between mb-1">
            <StatusBadge status={pool.status} />
            {isCommissioner && !archived && (
              <svg className="h-[14px] w-[14px] text-[#A39E96] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <p className="font-sans text-[13px] font-medium text-[#1A1A18] truncate leading-tight">{pool.name}</p>
          <p className="font-sans text-[9px] text-[#A39E96] truncate mt-0.5">{pool.tournament.name} · {dateStr}</p>
          <div className="mt-2">
            {isCommissioner ? <CommissionerMetrics pool={pool} /> : <PlayerMetrics pool={pool} />}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommissionerMetrics({ pool }: { pool: PoolItem }) {
  switch (pool.status) {
    case "SETUP":
      return <p className="font-sans text-[11px] font-medium text-[#8A6B1E]">Finish setup →</p>;
    case "OPEN":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-[#6B6560]">{pool.picksSubmitted}/{pool.memberCount} picked</span>
          {pool.unpaidCount > 0 && <span className="font-mono text-[11px] text-[#A3342D]">{pool.unpaidCount} unpaid</span>}
        </div>
      );
    case "LOCKED":
      return (
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-[#6B6560]">All locked</span>
          <span className="font-mono text-[11px] text-[#A39E96]">{pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}</span>
        </div>
      );
    case "LIVE":
      return (
        <div className="flex items-center gap-2">
          {pool.myBestRank !== null && (
            <span className="font-mono text-[16px] font-bold text-[#1A1A18]">T{pool.myBestRank}{pool.myBestRank <= 3 ? ordSuffix(pool.myBestRank) : ""}</span>
          )}
          <span className="font-mono text-[11px] text-[#A39E96]">{pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}</span>
        </div>
      );
    case "COMPLETE":
      return (
        <div>
          {pool.winnerName && <p className="font-sans text-[11px] font-medium text-[#1A1A18] truncate">🏆 {pool.winnerName}</p>}
          {pool.winnerScore !== null && <p className="font-mono text-[11px] text-[#6B6560]">{formatScore(pool.winnerScore)}</p>}
        </div>
      );
    case "ARCHIVED":
      return (
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-[#A39E96]">Archived</span>
          <span className="font-mono text-[11px] text-[#A39E96]">{pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}</span>
        </div>
      );
    default:
      return null;
  }
}

function PlayerMetrics({ pool }: { pool: PoolItem }) {
  switch (pool.status) {
    case "OPEN": {
      const d = new Date(pool.picksDeadline);
      const deadlineStr = isNaN(d.getTime()) ? "—" : `Picks due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      return <p className="font-sans text-[11px] text-[#8A6B1E]">{deadlineStr}</p>;
    }
    case "LOCKED":
      return <p className="font-sans text-[11px] text-[#6B6560]">Waiting for {pool.tournament.name}</p>;
    case "LIVE":
      return (
        <div className="flex items-baseline gap-1.5">
          {pool.myBestRank !== null ? (
            <>
              <span className="font-mono text-[16px] font-bold text-[#1A1A18]">{ordPosition(pool.myBestRank)}</span>
              <span className="font-mono text-[11px] text-[#A39E96]">/ {pool.entryCount}</span>
            </>
          ) : (
            <span className="font-sans text-[11px] text-[#A39E96]">No entries</span>
          )}
          {pool.myBestScore !== null && <span className="font-mono text-[11px] text-[#6B6560] ml-1">{formatScore(pool.myBestScore)}</span>}
        </div>
      );
    case "COMPLETE":
      return (
        <div className="flex items-baseline gap-1.5">
          {pool.myBestRank !== null ? (
            <>
              {pool.myBestRank === 1 ? (
                <span className="font-sans text-[11px] font-medium text-[#1A1A18]">Winner! 🏆</span>
              ) : (
                <span className="font-sans text-[11px] text-[#6B6560]">{ordPosition(pool.myBestRank)} place</span>
              )}
              {pool.myBestScore !== null && <span className="font-mono text-[11px] text-[#A39E96] ml-1">{formatScore(pool.myBestScore)}</span>}
            </>
          ) : (
            <span className="font-sans text-[11px] text-[#A39E96]">—</span>
          )}
        </div>
      );
    case "ARCHIVED":
      return <span className="font-sans text-[11px] text-[#A39E96]">{pool.myBestRank ? `${ordPosition(pool.myBestRank)} place` : "—"}</span>;
    default:
      return null;
  }
}

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
