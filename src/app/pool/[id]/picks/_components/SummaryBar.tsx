"use client";

import { Button } from "@/components/ui/Button";

interface SummaryBarProps {
  totalCategories: number;
  pickCount: number;
  onSubmit: () => void;
  submitting: boolean;
  isEdit: boolean;
}

export function SummaryBar({ totalCategories, pickCount, onSubmit, submitting, isEdit }: SummaryBarProps) {
  const allPicked = pickCount === totalCategories;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-green-200 bg-white px-4 py-3 sm:hidden safe-area-pb">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className={`text-sm font-semibold ${allPicked ? "text-green-800" : "text-green-600"}`}>
            {pickCount} of {totalCategories} picks
          </span>
        </div>
        <Button
          variant="primary"
          disabled={!allPicked || submitting}
          loading={submitting}
          onClick={onSubmit}
          className="shrink-0"
        >
          {isEdit ? "Update Picks" : "Submit Picks"}
        </Button>
      </div>
    </div>
  );
}
