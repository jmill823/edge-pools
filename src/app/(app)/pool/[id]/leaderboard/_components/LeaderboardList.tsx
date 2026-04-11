"use client";

import { EntryRow } from "./EntryRow";
import type { ScoreColor } from "@/lib/scoring/types";

interface RoundScoreDisplay {
  round: number;
  score: number | null;
  display: string;
  color: ScoreColor;
}

interface GolferScore {
  golferId: string;
  golferName: string;
  golferCountry: string | null;
  categoryName: string;
  categoryAbbrev: string;
  categorySortOrder: number;
  position: string | null;
  positionDisplay: string;
  status: "active" | "cut" | "withdrawn" | "complete";
  thru: number | null;
  thruDisplay: string;
  roundScores: RoundScoreDisplay[];
  total: number | null;
  totalDisplay: string;
  totalColor: ScoreColor;
  isExcludedByRosterRule: boolean;
  isReplacement: boolean;
  originalGolferName: string | null;
}

export interface LeaderboardEntry {
  entryId: string;
  teamName: string;
  userId: string | null;
  position: number;
  positionDisplay: string;
  total: number;
  totalDisplay: string;
  totalColor: ScoreColor;
  roundScores: RoundScoreDisplay[];
  activePicks: number;
  totalPicks: number;
  isCurrentUser: boolean;
  golfers: GolferScore[];
  submittedAt: string;
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  hasScores: boolean;
  expanded: string | null;
  onToggle: (id: string) => void;
  rosterRuleSummary: string | null;
  entryCount: number;
  tournamentName: string;
}

export function LeaderboardList({
  entries,
  hasScores,
  expanded,
  onToggle,
  rosterRuleSummary,
  entryCount,
  tournamentName,
}: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center font-sans text-sm" style={{ color: "var(--neutral-muted)" }}>
        No entries yet. Picks will appear on the leaderboard after submission.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[520px]">
        {/* Gold column headers */}
        <div
          className="flex items-center px-3 py-2"
          style={{ background: "var(--theme-primary)" }}
        >
          <span className="w-[36px] shrink-0 font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            POS
          </span>
          <span className="flex-1 min-w-[100px] font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            ENTRY
          </span>
          <span className="w-[36px] shrink-0 text-center font-sans text-[8px] font-semibold text-white/45 uppercase tracking-[0.5px]">
            MC
          </span>
          <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            R1
          </span>
          <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            R2
          </span>
          <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            R3
          </span>
          <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            R4
          </span>
          <span className="w-[48px] shrink-0 text-right font-sans text-[8px] font-semibold text-white uppercase tracking-[0.5px]">
            TOTAL
          </span>
        </div>

        {/* Entry rows */}
        <div>
          {entries.map((entry) => (
            <EntryRow
              key={entry.entryId}
              entry={entry}
              hasScores={hasScores}
              isExpanded={expanded === entry.entryId}
              onToggle={() => onToggle(entry.entryId)}
              rosterRuleSummary={rosterRuleSummary}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 text-center" style={{ borderTop: "0.5px solid var(--neutral-light-border)" }}>
          <span className="font-sans text-[9px]" style={{ color: "var(--neutral-icon)" }}>
            {entryCount} {entryCount === 1 ? "entry" : "entries"} &middot; {tournamentName}
          </span>
        </div>
      </div>
    </div>
  );
}
