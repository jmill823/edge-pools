import { formatScore, scoreColor, formatRankWithTies } from "./score-utils";

interface PickDetail {
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
  rank: number | null;
  previousRank: number | null;
  displayName: string;
  teamScore: number | null;
  entryNumber: number;
  maxEntries: number;
  isCurrentUser: boolean;
  isExpanded: boolean;
  allRanks: (number | null)[];
  picks: PickDetail[];
  hasScores: boolean;
  submittedAt: string;
  onToggle: () => void;
}

export function EntryRow({
  rank,
  previousRank,
  displayName,
  teamScore,
  entryNumber,
  maxEntries,
  isCurrentUser,
  isExpanded,
  allRanks,
  picks,
  hasScores,
  submittedAt,
  onToggle,
}: EntryRowProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-3 text-left rounded transition min-h-[44px] ${
          isCurrentUser ? "bg-[#E6F1FB] border border-blue-200" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasScores && (
            <span className="w-8 text-right text-sm font-bold text-green-900 shrink-0">
              {formatRankWithTies(rank, allRanks)}
            </span>
          )}
          {/* Movement arrow */}
          {hasScores && (
            <MovementArrow rank={rank} previousRank={previousRank} />
          )}
          <div className="min-w-0">
            <span className="block text-sm font-medium text-green-900 truncate">
              {displayName}
              {maxEntries > 1 && <span className="text-green-500"> · E{entryNumber}</span>}
            </span>
            {!hasScores && (
              <span className="text-xs text-green-500">
                Submitted {new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasScores && (
            <span className={`text-sm font-bold ${scoreColor(teamScore)}`}>
              {formatScore(teamScore)}
            </span>
          )}
          <svg
            className={`h-4 w-4 text-green-400 transition ${isExpanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="ml-11 mb-2 rounded-b border-l-2 border-green-200 pl-3 py-2 space-y-1.5">
          {picks.map((pick, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className="text-green-500">{pick.categoryName}</span>
                <span className="mx-1 text-green-300">&rarr;</span>
                <span className={`font-medium ${
                  pick.golferPosition === "CUT" || pick.golferPosition === "WD"
                    ? "text-red-500" : "text-green-900"
                }`}>
                  {pick.golferName}
                </span>
                {pick.isReplacement && pick.originalGolferName && (
                  <span className="ml-1 text-red-400">
                    (replaced <span className="line-through">{pick.originalGolferName}</span>)
                  </span>
                )}
              </div>
              <span className={`shrink-0 ml-2 font-mono font-medium ${
                pick.golferPosition === "CUT" || pick.golferPosition === "WD"
                  ? "text-red-500" : scoreColor(pick.golferScore)
              }`}>
                {pick.golferPosition === "CUT" ? "CUT"
                  : pick.golferPosition === "WD" ? "WD"
                  : pick.golferScore !== null ? formatScore(pick.golferScore)
                  : "\u2014"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MovementArrow({ rank, previousRank }: { rank: number | null; previousRank: number | null }) {
  if (rank === null || previousRank === null || previousRank === 0) {
    return <span className="w-6 text-center text-[10px] text-gray-400 shrink-0">&mdash;</span>;
  }

  const diff = previousRank - rank; // positive = moved up

  if (diff > 0) {
    return (
      <span className="w-6 text-center text-[10px] font-bold text-[#0F6E56] shrink-0">
        &#9650;{diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="w-6 text-center text-[10px] font-bold text-[#A32D2D] shrink-0">
        &#9660;{Math.abs(diff)}
      </span>
    );
  }

  return <span className="w-6 text-center text-[10px] text-gray-400 shrink-0">&mdash;</span>;
}
