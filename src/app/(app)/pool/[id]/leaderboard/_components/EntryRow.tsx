"use client";

import { scoreColorClass, formatGolferNameShort } from "./score-utils";
import type { LeaderboardEntry } from "./LeaderboardList";

interface EntryRowProps {
  entry: LeaderboardEntry;
  hasScores: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  rosterRuleSummary: string | null;
}

export function EntryRow({
  entry,
  hasScores,
  isExpanded,
  onToggle,
  rosterRuleSummary,
}: EntryRowProps) {
  const isYou = entry.isCurrentUser;

  return (
    <div>
      {/* Team row */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center px-3 py-2.5 text-left transition-colors duration-150 min-h-[44px] cursor-pointer border-b border-border/50 ${
          isYou
            ? "bg-[#E8F0E5]"
            : "hover:bg-surface-alt"
        }`}
      >
        {/* POS */}
        <span className="w-[36px] shrink-0 font-mono text-xs font-bold text-[#C4B896]">
          {hasScores ? entry.positionDisplay : "\u2014"}
        </span>

        {/* ENTRY */}
        <span
          className={`flex-1 min-w-[100px] truncate font-body text-[12px] ${
            isYou ? "font-semibold" : "font-medium"
          } text-text-primary`}
          style={{ maxWidth: "120px" }}
        >
          {entry.teamName}
        </span>

        {/* MC column — ghosted */}
        <span className="w-[36px] shrink-0 text-center font-mono text-[9px] text-text-muted opacity-45">
          {entry.activePicks}/{entry.totalPicks}
        </span>

        {/* R1-R4 */}
        {entry.roundScores.map((rs) => (
          <span
            key={rs.round}
            className={`w-[36px] shrink-0 text-right font-mono text-[10px] ${
              hasScores ? scoreColorClass(rs.color) : "text-text-muted"
            }`}
          >
            {hasScores ? rs.display : "-"}
          </span>
        ))}

        {/* TOTAL */}
        <span
          className={`w-[48px] shrink-0 text-right font-mono text-[12px] font-medium ${
            hasScores ? scoreColorClass(entry.totalColor) : "text-text-muted"
          }`}
        >
          {hasScores ? entry.totalDisplay : "-"}
        </span>
      </button>

      {/* Expanded golfer details */}
      {isExpanded && (
        <div
          className="bg-surface border-b border-border overflow-hidden"
          style={{
            animation: "expandIn 200ms ease forwards",
          }}
        >
          {/* Golfer column headers */}
          <div className="flex items-center px-3 py-1.5 bg-surface-alt border-b border-border/50">
            <span className="w-[30px] shrink-0 font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              POS
            </span>
            <span className="w-[36px] shrink-0 font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              CAT
            </span>
            <span className="flex-1 min-w-[80px] font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              PLAYER
            </span>
            <span className="w-[30px] shrink-0 text-center font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              THRU
            </span>
            <span className="w-[32px] shrink-0 text-right font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              R1
            </span>
            <span className="w-[32px] shrink-0 text-right font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              R2
            </span>
            <span className="w-[32px] shrink-0 text-right font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              R3
            </span>
            <span className="w-[32px] shrink-0 text-right font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              R4
            </span>
            <span className="w-[40px] shrink-0 text-right font-display text-[8px] font-medium text-text-muted uppercase tracking-[0.5px]">
              TOTAL
            </span>
          </div>

          {/* Golfer rows */}
          {entry.golfers.map((golfer) => {
            const isMcOrWd = golfer.status === "cut" || golfer.status === "withdrawn";
            const isExcluded = golfer.isExcludedByRosterRule;
            const rowOpacity = isMcOrWd ? "opacity-45" : isExcluded ? "opacity-35" : "";

            return (
              <div
                key={golfer.golferId}
                className={`flex items-center px-3 py-1.5 border-b border-border/30 ${rowOpacity}`}
              >
                {/* POS */}
                <span className="w-[30px] shrink-0 font-mono text-[10px] text-text-secondary">
                  {isMcOrWd ? "-" : golfer.positionDisplay}
                </span>

                {/* CAT */}
                <span className="w-[36px] shrink-0 font-body text-[9px] font-medium text-[#2D5F3B]">
                  {golfer.categoryAbbrev}
                </span>

                {/* PLAYER */}
                <span className="flex-1 min-w-[80px] font-body text-[11px] text-text-primary truncate">
                  {formatGolferNameShort(golfer.golferName)}
                  {golfer.isReplacement && golfer.originalGolferName && (
                    <span className="ml-1 text-[9px] text-accent-danger">
                      (was <span className="line-through">{formatGolferNameShort(golfer.originalGolferName)}</span>)
                    </span>
                  )}
                </span>

                {/* THRU */}
                <span className="w-[30px] shrink-0 text-center">
                  {golfer.status === "cut" ? (
                    <span className="inline-block px-1 py-0.5 rounded-[3px] bg-text-muted/20 text-text-muted font-body text-[8px] font-medium">
                      MC
                    </span>
                  ) : golfer.status === "withdrawn" ? (
                    <span className="inline-block px-1 py-0.5 rounded-[3px] bg-text-muted/20 text-text-muted font-body text-[8px] font-medium">
                      WD
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-text-muted">
                      {golfer.thruDisplay}
                    </span>
                  )}
                </span>

                {/* R1-R4 */}
                {golfer.roundScores.map((rs) => (
                  <span
                    key={rs.round}
                    className={`w-[32px] shrink-0 text-right font-mono text-[10px] ${scoreColorClass(rs.color)}`}
                  >
                    {rs.display}
                  </span>
                ))}

                {/* TOTAL */}
                <span
                  className={`w-[40px] shrink-0 text-right font-mono text-[10px] font-medium ${scoreColorClass(golfer.totalColor)} ${
                    isExcluded ? "line-through" : ""
                  }`}
                >
                  {golfer.totalDisplay}
                </span>
              </div>
            );
          })}

          {/* Roster rule summary */}
          {rosterRuleSummary && (
            <div className="px-3 py-1.5 text-center">
              <span className="font-body text-[9px] text-text-muted italic">
                {rosterRuleSummary}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
