import { formatScore, scoreColor, formatRankWithTies } from "./score-utils";

interface MyEntryCardProps {
  rank: number | null;
  displayName: string;
  teamScore: number | null;
  entryNumber: number;
  maxEntries: number;
  allRanks: (number | null)[];
  onTap: () => void;
}

export function MyEntryCard({
  rank,
  displayName,
  teamScore,
  entryNumber,
  maxEntries,
  allRanks,
  onTap,
}: MyEntryCardProps) {
  return (
    <button
      onClick={onTap}
      className="w-full rounded-lg border-2 border-green-400 bg-green-50 p-3 text-left min-h-[44px]"
    >
      <span className="text-xs font-medium text-green-600">Your Position</span>
      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-2xl font-bold text-green-900">
            {formatRankWithTies(rank, allRanks)}
          </span>
          <span className="text-sm text-green-700 truncate">
            {displayName}
            {maxEntries > 1 && <span className="text-green-500"> · E{entryNumber}</span>}
          </span>
        </div>
        <span className={`text-2xl font-bold ${scoreColor(teamScore)}`}>
          {formatScore(teamScore)}
        </span>
      </div>
    </button>
  );
}
