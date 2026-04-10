"use client";

import { EntryRow } from "./EntryRow";

interface PickDetail {
  golferId: string;
  categoryName: string;
  golferName: string;
  golferCountry: string | null;
  golferScore: number | null;
  golferPosition: string | null;
  holesCompleted: number;
  round: number;
  isReplacement: boolean;
  originalGolferName: string | null;
}

interface LeaderboardEntry {
  id: string;
  teamName: string;
  teamScore: number | null;
  rank: number | null;
  previousRank: number | null;
  entryNumber: number;
  isCurrentUser: boolean;
  submittedAt: string;
  winProbability: number | null;
  cutProbability: number | null;
  picks: PickDetail[];
}

interface LeaderboardListProps {
  poolId: string;
  entries: LeaderboardEntry[];
  maxEntries: number;
  hasScores: boolean;
  isComplete: boolean;
  currentRound: number | null;
  allRanks: (number | null)[];
  expanded: string | null;
  onToggle: (id: string) => void;
}

export function LeaderboardList({
  poolId,
  entries,
  maxEntries,
  hasScores,
  isComplete,
  currentRound,
  allRanks,
  expanded,
  onToggle,
}: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center font-body text-sm text-text-muted">
        No entries yet. Picks will appear on the leaderboard after submission.
      </div>
    );
  }

  return (
    <>
      {/* Column headers */}
      <div className="flex items-center bg-surface-alt px-3 py-2 border-b border-border mb-0.5">
        <span className="w-[30px] font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Rank</span>
        <span className="w-[36px] font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Cut%</span>
        <span className="flex-1 font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Team</span>
        <span className="w-[40px] text-right font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">Score</span>
        <span className="w-[44px] text-right font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">%Win</span>
      </div>

      {/* Entry rows */}
      <div className="space-y-0.5">
        {entries.map((entry, idx) => (
          <EntryRow
            key={entry.id}
            entryId={entry.id}
            poolId={poolId}
            rank={entry.rank}
            previousRank={entry.previousRank}
            teamName={entry.teamName}
            teamScore={entry.teamScore}
            entryNumber={entry.entryNumber}
            maxEntries={maxEntries}
            isCurrentUser={entry.isCurrentUser}
            isExpanded={expanded === entry.id}
            allRanks={allRanks}
            picks={entry.picks}
            hasScores={hasScores}
            currentRound={currentRound}
            submittedAt={entry.submittedAt}
            winProbability={entry.winProbability}
            cutProbability={entry.cutProbability}
            onToggle={() => onToggle(entry.id)}
            isEvenRow={idx % 2 === 0}
            isWinner={isComplete && entry.rank === 1}
          />
        ))}
      </div>
    </>
  );
}
