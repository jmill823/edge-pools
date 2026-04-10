"use client";

import { formatScore } from "./score-utils";

interface WinnerCelebrationProps {
  winnerName: string;
  poolName: string;
  tournamentName: string;
  winnerScore: number | null;
}

export function WinnerCelebration({
  winnerName,
  poolName,
  tournamentName,
  winnerScore,
}: WinnerCelebrationProps) {
  return (
    <div className="rounded-card border border-accent-secondary/30 bg-gradient-to-r from-[#FDF4E3] to-[#F5EDD5] px-4 py-4 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl" role="img" aria-label="Trophy">🏆</span>
        <h2 className="font-display text-base font-bold text-text-primary">
          {winnerName} wins {poolName}!
        </h2>
      </div>
      <p className="font-body text-sm text-text-secondary">
        {tournamentName}
        {winnerScore !== null && (
          <span className="ml-2 font-mono font-bold text-accent-primary">
            {formatScore(winnerScore)}
          </span>
        )}
      </p>
    </div>
  );
}
