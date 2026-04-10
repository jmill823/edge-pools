import { formatScore, scoreColor, formatRankWithTies } from "./score-utils";
import { HoleByHoleCard } from "./HoleByHoleCard";

interface PickDetail {
  golferId: string;
  categoryName: string;
  golferName: string;
  golferCountry: string | null;
  golferScore: number | null;
  golferPosition: string | null;
  isReplacement: boolean;
  originalGolferName: string | null;
}

interface EntryRowProps {
  entryId: string;
  poolId: string;
  rank: number | null;
  previousRank: number | null;
  teamName: string;
  teamScore: number | null;
  entryNumber: number;
  maxEntries: number;
  isCurrentUser: boolean;
  isExpanded: boolean;
  allRanks: (number | null)[];
  picks: PickDetail[];
  hasScores: boolean;
  currentRound: number | null;
  submittedAt: string;
  winProbability: number | null;
  cutProbability: number | null;
  onToggle: () => void;
  isEvenRow?: boolean;
}

function cutPercentColor(cutPct: number | null): string {
  if (cutPct === null) return "text-text-muted";
  if (cutPct === 0) return "text-accent-success";
  if (cutPct <= 25) return "text-accent-secondary";
  if (cutPct <= 50) return "text-accent-secondary";
  return "text-accent-danger";
}

export function EntryRow({
  rank,
  poolId,
  teamName,
  teamScore,
  entryNumber,
  maxEntries,
  isCurrentUser,
  isExpanded,
  allRanks,
  picks,
  hasScores,
  currentRound,
  submittedAt,
  winProbability,
  cutProbability,
  onToggle,
  isEvenRow,
}: EntryRowProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center px-3 py-3 text-left rounded-data transition-colors duration-150 min-h-[44px] cursor-pointer ${
          isCurrentUser
            ? "bg-[#F0F5F2] border-l-[3px] border-accent-primary"
            : isEvenRow
              ? "bg-surface-alt"
              : "hover:bg-surface-alt"
        }`}
      >
        {/* Rank — always show column, dash when no scores */}
        <span className={`w-[30px] shrink-0 font-mono text-xs font-bold ${hasScores ? "text-text-primary" : "text-text-muted"}`}>
          {hasScores ? formatRankWithTies(rank, allRanks) : "\u2014"}
        </span>
        {/* Cut% */}
        <span className={`w-[36px] shrink-0 font-mono text-[10px] ${hasScores ? cutPercentColor(cutProbability) : "text-text-muted"}`}>
          {hasScores && cutProbability !== null ? `${cutProbability}%` : "\u2014"}
        </span>
        {/* Team Name */}
        <span className={`flex-1 min-w-0 truncate font-body text-sm ${
          isCurrentUser ? "font-semibold" : "font-medium"
        } text-text-primary`}>
          {teamName}
          {maxEntries > 1 && <span className="text-text-muted text-xs"> · E{entryNumber}</span>}
        </span>
        {/* Score */}
        <span className={`w-[40px] shrink-0 text-right font-mono text-[13px] font-bold ${hasScores ? scoreColor(teamScore) : "text-text-muted"}`}>
          {hasScores ? formatScore(teamScore) : "\u2014"}
        </span>
        {/* %Win */}
        <span className={`w-[44px] shrink-0 text-right font-mono text-[11px] ${hasScores ? "text-accent-secondary" : "text-text-muted"}`}>
          {hasScores && winProbability !== null ? `${winProbability}%` : "\u2014"}
        </span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform duration-200 ml-1 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="ml-4 mb-2 rounded-b border-l-2 border-border pl-3 py-2 space-y-1.5">
          {picks.map((pick, i) => (
            <div key={i} className="flex items-center justify-between font-body text-xs">
              <div className="min-w-0">
                <span className="text-text-muted">{pick.categoryName}</span>
                <span className="mx-1 text-border">&rarr;</span>
                <span className={`font-medium ${
                  pick.golferPosition === "CUT" || pick.golferPosition === "WD"
                    ? "text-accent-danger" : "text-text-primary"
                }`}>
                  {pick.golferName}
                </span>
                {pick.isReplacement && pick.originalGolferName && (
                  <span className="ml-1 text-accent-danger">
                    (replaced <span className="line-through">{pick.originalGolferName}</span>)
                  </span>
                )}
              </div>
              <span className={`shrink-0 ml-2 font-mono font-medium ${
                pick.golferPosition === "CUT" || pick.golferPosition === "WD"
                  ? "text-accent-danger" : scoreColor(pick.golferScore)
              }`}>
                {pick.golferPosition === "CUT" ? "CUT"
                  : pick.golferPosition === "WD" ? "WD"
                  : pick.golferScore !== null ? formatScore(pick.golferScore)
                  : "\u2014"}
              </span>
            </div>
          ))}

          {/* Hole-by-hole scorecards — only when pool has scores */}
          {hasScores && (
            <div className="border-t border-border/50 pt-1.5 mt-1.5">
              <HoleByHoleCard
                poolId={poolId}
                golferIds={picks.map((p) => p.golferId)}
                golferNames={picks.map((p) => p.golferName)}
                currentRound={currentRound}
              />
            </div>
          )}

          {/* Timestamp at bottom of expansion */}
          <div className="pt-1 border-t border-border/50">
            <span className="font-mono text-[10px] text-text-muted">
              Submitted {new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
              {new Date(submittedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
