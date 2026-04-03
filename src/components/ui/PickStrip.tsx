"use client";

interface PickData {
  categoryName: string;
  golferName: string;
  score?: number | null;
}

interface PickStripProps {
  picks: PickData[];
  maxVisible?: number;
}

/**
 * Shared horizontal-scrolling pick strip used across my-entries, leaderboard, and success screens.
 * Shows category name, golfer last name, and optional score per pick.
 */
export function PickStrip({ picks, maxVisible }: PickStripProps) {
  const visible = maxVisible && maxVisible < picks.length ? picks.slice(0, maxVisible) : picks;
  const remaining = maxVisible && maxVisible < picks.length ? picks.length - maxVisible : 0;

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <div className="flex min-w-max gap-1.5 px-3 py-2">
        {visible.map((pick, i) => (
          <div
            key={i}
            className="shrink-0 rounded-md bg-green-50 border border-green-200 px-2.5 py-1.5 min-w-[90px] max-w-[130px]"
          >
            <div className="text-[9px] text-green-500 truncate leading-tight">
              {pick.categoryName}
            </div>
            <div className="text-[11px] font-bold text-green-900 truncate mt-0.5 leading-tight">
              {lastName(pick.golferName)}
            </div>
            {pick.score !== undefined && pick.score !== null && (
              <div className={`text-[10px] font-medium mt-0.5 leading-tight ${scoreColor(pick.score)}`}>
                {formatScore(pick.score)}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="shrink-0 flex items-center px-2 text-[10px] text-green-500 font-medium">
            +{remaining} more
          </div>
        )}
      </div>
    </div>
  );
}

function lastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function scoreColor(score: number): string {
  if (score < 0) return "text-[#0F6E56]"; // under par — green
  if (score > 0) return "text-[#854F0B]"; // over par — amber
  return "text-gray-500"; // even
}

function formatScore(score: number): string {
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}
