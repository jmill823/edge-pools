"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface SuccessScreenProps {
  poolId: string;
  poolName: string;
  pickCount: number;
  isEdit: boolean;
  entryNumber: number;
  maxEntries: number;
  currentEntryCount: number;
  onAddAnother?: () => void;
}

export function SuccessScreen({
  poolId,
  poolName,
  pickCount,
  isEdit,
  entryNumber,
  maxEntries,
  currentEntryCount,
  onAddAnother,
}: SuccessScreenProps) {
  const canAddMore = maxEntries > 1 && currentEntryCount < maxEntries;
  const showEntryNumber = maxEntries > 1;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F3ED]">
        <svg className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-bold text-text-primary">
        {isEdit ? "Picks Updated!" : showEntryNumber ? `Entry ${entryNumber} Submitted!` : "Picks Submitted!"}
      </h2>
      <p className="mt-2 font-body text-text-secondary">
        You picked {pickCount} golfers for {poolName}.
      </p>

      {canAddMore && (
        <p className="mt-1 font-mono text-xs text-text-muted">
          You can submit up to {maxEntries} entries ({currentEntryCount} of {maxEntries} used)
        </p>
      )}

      <div className="mt-8 space-y-3">
        {canAddMore && onAddAnother && (
          <Button variant="primary" className="w-full" onClick={onAddAnother}>
            Add Another Entry
          </Button>
        )}
        <Link href={`/pool/${poolId}/leaderboard`}>
          <Button variant={canAddMore ? "secondary" : "primary"} className="w-full">View Leaderboard</Button>
        </Link>
        <Link href={`/pool/${poolId}/my-entries`}>
          <Button variant="secondary" className="w-full">View My Entries</Button>
        </Link>
      </div>
    </div>
  );
}
