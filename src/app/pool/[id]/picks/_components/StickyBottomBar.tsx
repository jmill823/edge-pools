"use client";

interface StickyBottomBarProps {
  pickCount: number;
  totalCategories: number;
  isEdit: boolean;
  isComplete: boolean;
  onSubmit: () => void;
}

/**
 * StickyBottomBar — fixed bottom bar showing pick progress and submit button.
 */
export function StickyBottomBar({
  pickCount,
  totalCategories,
  isEdit,
  isComplete,
  onSubmit,
}: StickyBottomBarProps) {

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 border-t bg-white"
      style={{
        height: 56,
        borderColor: "#E2DDD5",
      }}
    >
      {/* Pick count */}
      <span className="font-body text-sm text-text-secondary">
        <span className="font-bold text-text-primary">{pickCount}</span> of {totalCategories} picks
      </span>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!isComplete}
        className="font-body text-sm font-medium px-5 py-2.5 rounded-btn transition-colors duration-200 min-h-[44px] cursor-pointer disabled:cursor-default"
        style={{
          backgroundColor: isComplete ? "#2D5F3B" : "#D4D0C8",
          color: isComplete ? "white" : "#8A8580",
        }}
      >
        {isEdit ? "Save changes" : "Submit picks"}
      </button>
    </div>
  );
}
