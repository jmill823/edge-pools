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
      className="fixed left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[80%] sm:max-w-[1200px] z-40 flex items-center justify-between px-4 border-t bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.08)] bottom-[56px] sm:bottom-0"
      style={{
        height: 56,
        borderColor: "var(--neutral-border)",
      }}
    >
      {/* Pick count */}
      <span className="font-sans text-sm text-text-secondary">
        <span className="font-bold text-text-primary">{pickCount}</span> of {totalCategories} picks
      </span>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!isComplete}
        className="font-sans text-sm font-medium px-5 py-2.5 rounded-btn transition-colors duration-200 min-h-[44px] cursor-pointer disabled:cursor-default"
        style={{
          backgroundColor: isComplete ? "var(--theme-primary)" : "var(--neutral-border)",
          color: isComplete ? "white" : "#8A8580",
        }}
      >
        {isEdit ? "Save changes" : "Submit picks"}
      </button>
    </div>
  );
}
