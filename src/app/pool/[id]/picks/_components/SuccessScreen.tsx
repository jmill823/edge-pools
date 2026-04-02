"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface SuccessScreenProps {
  poolId: string;
  poolName: string;
  pickCount: number;
  isEdit: boolean;
}

export function SuccessScreen({ poolId, poolName, pickCount, isEdit }: SuccessScreenProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-green-900">
        {isEdit ? "Picks Updated!" : "Picks Submitted!"}
      </h2>
      <p className="mt-2 text-green-600">
        You picked {pickCount} golfers for {poolName}.
      </p>
      <div className="mt-8 space-y-3">
        <Link href={`/pool/${poolId}/leaderboard`}>
          <Button variant="primary" className="w-full">View Leaderboard</Button>
        </Link>
        <Link href={`/pool/${poolId}/my-entries`}>
          <Button variant="secondary" className="w-full">View My Entries</Button>
        </Link>
      </div>
    </div>
  );
}
