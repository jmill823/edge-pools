import { formatScore, scoreColor, formatRankWithTies } from "./score-utils";
import { PickStrip } from "@/components/ui/PickStrip";

interface PickDetail {
  categoryName: string;
  golferName: string;
  golferScore: number | null;
}

interface MyEntryCardProps {
  rank: number | null;
  teamName: string;
  teamScore: number | null;
  entryNumber: number;
  maxEntries: number;
  allRanks: (number | null)[];
  picks: PickDetail[];
  winProbability: number | null;
  cutProbability: number | null;
  onTap: () => void;
}

export function MyEntryCard({
  rank,
  teamName,
  teamScore,
  entryNumber,
  maxEntries,
  allRanks,
  picks,
  winProbability,
  onTap,
}: MyEntryCardProps) {
  const pickStripData = picks.map((p) => ({
    categoryName: p.categoryName,
    golferName: p.golferName,
    score: p.golferScore,
  }));

  return (
    <div className="rounded-card border-[1.5px] border-accent-primary bg-[#F0F5F2] overflow-hidden">
      <button
        onClick={onTap}
        className="w-full p-3 text-left min-h-[44px] cursor-pointer"
      >
        <span className="font-sans text-xs font-medium text-accent-primary">My Entry</span>
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {formatRankWithTies(rank, allRanks)}
            </span>
            <span className="font-sans text-sm font-semibold text-text-primary truncate">
              {teamName}
              {maxEntries > 1 && <span className="text-text-muted font-normal"> · E{entryNumber}</span>}
            </span>
          </div>
          <div className="flex items-baseline gap-2 shrink-0">
            {winProbability !== null && (
              <span className="font-mono text-xs text-accent-secondary">{winProbability}%</span>
            )}
            <span className={`font-mono text-2xl font-bold ${scoreColor(teamScore)}`}>
              {formatScore(teamScore)}
            </span>
          </div>
        </div>
      </button>
      {pickStripData.length > 0 && (
        <div className="border-t border-border">
          <PickStrip picks={pickStripData} />
        </div>
      )}
    </div>
  );
}
