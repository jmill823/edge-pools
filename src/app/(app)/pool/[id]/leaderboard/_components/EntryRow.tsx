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
        className="w-full flex items-center px-3 py-2.5 text-left transition-colors duration-150 min-h-[44px] cursor-pointer"
        style={{
          borderBottom: "0.5px solid var(--neutral-row-border)",
          background: isYou ? "var(--neutral-you-row)" : undefined,
        }}
      >
        {/* POS */}
        <span className="w-[36px] shrink-0 font-mono text-xs font-semibold" style={{ color: "var(--neutral-muted)" }}>
          {hasScores ? entry.positionDisplay : "\u2014"}
        </span>

        {/* ENTRY — gold for non-You, dark for You */}
        <span
          className="flex-1 min-w-[100px] truncate font-sans text-[12px]"
          style={{
            maxWidth: "120px",
            color: isYou ? "var(--neutral-text)" : "var(--theme-text)",
            fontWeight: isYou ? 700 : 500,
          }}
        >
          {entry.teamName}
        </span>

        {/* MC column — ghosted */}
        <span className="w-[36px] shrink-0 text-center font-mono text-[9px] opacity-45" style={{ color: "var(--score-pending)" }}>
          {entry.activePicks}/{entry.totalPicks}
        </span>

        {/* R1-R4 */}
        {entry.roundScores.map((rs) => (
          <span
            key={rs.round}
            className={`w-[36px] shrink-0 text-right font-mono text-[10px] ${
              hasScores ? scoreColorClass(rs.color) : ""
            }`}
            style={!hasScores ? { color: "var(--score-pending)" } : undefined}
          >
            {hasScores ? rs.display : "-"}
          </span>
        ))}

        {/* TOTAL */}
        <span
          className={`w-[48px] shrink-0 text-right font-mono text-[12px] font-medium ${
            hasScores ? scoreColorClass(entry.totalColor) : ""
          }`}
          style={!hasScores ? { color: "var(--score-pending)" } : undefined}
        >
          {hasScores ? entry.totalDisplay : "-"}
        </span>
      </button>

      {/* Expanded golfer details */}
      {isExpanded && (
        <div
          className="bg-surface overflow-hidden"
          style={{
            animation: "expandIn 200ms ease forwards",
            borderBottom: "0.5px solid var(--neutral-row-border)",
          }}
        >
          {/* Golfer column headers — aligned to parent grid */}
          <div
            className="flex items-center px-3 py-1.5 bg-white"
            style={{ borderBottom: "0.5px solid var(--neutral-row-border)" }}
          >
            {/* Maps to parent POS (36px) — split: POS + CAT label */}
            <span className="w-[36px] shrink-0 font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              POS
            </span>
            {/* Maps to parent ENTRY (flex-1 min-100px) — PLAYER spans this area */}
            <span className="flex-1 min-w-[100px] font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              PLAYER
            </span>
            {/* Maps to parent MC (36px) — THRU */}
            <span className="w-[36px] shrink-0 text-center font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              THRU
            </span>
            {/* Maps to parent R1-R4 (4×36px) */}
            <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              R1
            </span>
            <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              R2
            </span>
            <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              R3
            </span>
            <span className="w-[36px] shrink-0 text-right font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
              R4
            </span>
            {/* Maps to parent TOTAL (48px) */}
            <span className="w-[48px] shrink-0 text-right font-sans text-[8px] font-semibold text-[#6B7280] uppercase tracking-[0.5px]">
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
                className={`flex items-center px-3 py-1.5 ${rowOpacity}`}
                style={{ borderBottom: "0.5px solid var(--neutral-row-border)" }}
              >
                {/* POS — aligned to parent POS (36px) */}
                <span className="w-[36px] shrink-0 font-mono text-[10px]" style={{ color: "var(--neutral-secondary)" }}>
                  {isMcOrWd ? "-" : golfer.positionDisplay}
                </span>

                {/* PLAYER (with CAT prefix) — aligned to parent ENTRY (flex-1 min-100px) */}
                <span className="flex-1 min-w-[100px] font-sans text-[11px] truncate" style={{ color: "var(--neutral-text)" }}>
                  <span className="font-sans text-[9px] font-medium mr-1" style={{ color: "var(--theme-text)" }}>
                    {golfer.categoryAbbrev}
                  </span>
                  {formatGolferNameShort(golfer.golferName)}
                  {golfer.isReplacement && golfer.originalGolferName && (
                    <span className="ml-1 text-[9px]" style={{ color: "var(--score-over)" }}>
                      (was <span className="line-through">{formatGolferNameShort(golfer.originalGolferName)}</span>)
                    </span>
                  )}
                </span>

                {/* THRU — aligned to parent MC (36px) */}
                <span className="w-[36px] shrink-0 text-center">
                  {golfer.status === "cut" ? (
                    <span className="inline-block px-1 py-0.5 rounded-[3px] font-sans text-[8px] font-medium" style={{ background: "rgba(var(--neutral-muted), 0.2)", color: "var(--neutral-muted)" }}>
                      MC
                    </span>
                  ) : golfer.status === "withdrawn" ? (
                    <span className="inline-block px-1 py-0.5 rounded-[3px] font-sans text-[8px] font-medium" style={{ background: "rgba(var(--neutral-muted), 0.2)", color: "var(--neutral-muted)" }}>
                      WD
                    </span>
                  ) : (
                    <span className="font-mono text-[10px]" style={{ color: "var(--score-pending)" }}>
                      {golfer.thruDisplay}
                    </span>
                  )}
                </span>

                {/* R1-R4 — aligned to parent R1-R4 (4×36px) */}
                {golfer.roundScores.map((rs) => (
                  <span
                    key={rs.round}
                    className={`w-[36px] shrink-0 text-right font-mono text-[10px] ${scoreColorClass(rs.color)}`}
                  >
                    {rs.display}
                  </span>
                ))}

                {/* TOTAL — aligned to parent TOTAL (48px) */}
                <span
                  className={`w-[48px] shrink-0 text-right font-mono text-[10px] font-medium ${scoreColorClass(golfer.totalColor)} ${
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
              <span className="font-sans text-[9px] italic" style={{ color: "var(--neutral-muted)" }}>
                {rosterRuleSummary}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
