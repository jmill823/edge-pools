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

// D-3: Bolder strip colors for 4px line visibility
const STRIP_COLORS: Record<string, string> = {
  SETUP: "#A39E96",
  OPEN: "#C4973B",
  LOCKED: "#6B6560",
  LIVE: "#2D7A4F",
  COMPLETE: "#185FA5",
  ARCHIVED: "#A39E96",
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

  // D-2: Correct routing per role + status
  let href: string;
  if (isCommissioner) {
    href = `/pool/${pool.id}/manage`;
  } else {
    switch (pool.status) {
      case "OPEN":
        href = pool.hasSubmittedPicks ? `/pool/${pool.id}/leaderboard` : `/pool/${pool.id}/picks`;
        break;
      case "SETUP":
        href = `/pool/${pool.id}`;
        break;
      default:
        href = `/pool/${pool.id}/leaderboard`;
    }
  }

  const stripColor = archived ? "#A39E96" : (STRIP_COLORS[pool.status] || "#A39E96");

  const start = new Date(pool.tournament.startDate);
  const end = new Date(pool.tournament.endDate);
  const dateStr = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.getDate()}`;

  return (
    <Link href={href} className="block cursor-pointer">
      <div className={`bg-white border-[0.5px] border-[#E2DDD5] rounded-[8px] overflow-hidden hover:border-[#1B5E3B]/40 transition-colors duration-200 ${archived ? "opacity-60" : ""}`}>
        {/* D-3: 4px status color strip */}
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
          <p className="font-sans text-[13px] font-semibold text-[#1A1A18] truncate leading-tight">{pool.name}</p>
          <p className="font-sans text-[9px] text-[#A39E96] truncate mt-0.5">{pool.tournament.name} · {dateStr}</p>
          {/* D-1: Status-specific metric */}
          <div className="mt-1">
            <CardMetric pool={pool} isCommissioner={isCommissioner} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// D-1: Unified metric line
function CardMetric({ pool, isCommissioner }: { pool: PoolItem; isCommissioner: boolean }) {
  switch (pool.status) {
    case "SETUP":
      return <p className="font-sans text-[13px] font-medium text-[#B09A60]">Finish setup →</p>;
    case "OPEN":
      return (
        <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
          {pool.picksSubmitted}/{pool.memberCount} picked
        </p>
      );
    case "LOCKED":
      return (
        <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
          Locked · {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
        </p>
      );
    case "LIVE":
      if (isCommissioner && pool.myBestRank !== null) {
        return (
          <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
            {ordPosition(pool.myBestRank)} of {pool.entryCount}
          </p>
        );
      }
      if (!isCommissioner && pool.myBestRank !== null) {
        return (
          <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
            {ordPosition(pool.myBestRank)} of {pool.entryCount}
          </p>
        );
      }
      return (
        <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
          {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
        </p>
      );
    case "COMPLETE":
      if (pool.winnerName) {
        return <p className="font-sans text-[14px] font-semibold text-[#1A1A18] truncate">Winner: {pool.winnerName}</p>;
      }
      return <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">{pool.entryCount} entries</p>;
    case "ARCHIVED": {
      const endDate = new Date(pool.tournament.endDate);
      const month = endDate.toLocaleDateString("en-US", { month: "short" });
      const year = endDate.getFullYear();
      return (
        <p className="font-mono text-[14px] font-semibold text-[#1A1A18]">
          {month} {year} · {pool.entryCount} {pool.entryCount === 1 ? "entry" : "entries"}
        </p>
      );
    }
    default:
      return null;
  }
}

function ordSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function ordPosition(n: number): string {
  return `${n}${ordSuffix(n)}`;
}
