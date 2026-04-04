"use client";

import { getCategoryColor, getInitials } from "@/lib/golf-utils";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface Golfer {
  id: string;
  name: string;
}

interface BubbleStripProps {
  categories: Category[];
  selections: Map<string, string>;
  golferLookup: Map<string, Golfer>;
  activeCategoryId: string | null;
  onBubbleTap: (categoryId: string) => void;
}

/**
 * BubbleStrip — 9 progress circles showing pick status per category.
 * States: filled (pick made), active (currently picking), pending (not reached).
 */
export function BubbleStrip({
  categories,
  selections,
  golferLookup,
  activeCategoryId,
  onBubbleTap,
}: BubbleStripProps) {
  return (
    <div className="w-full py-3" style={{ backgroundColor: "#F7F5F0" }}>
      <div className="flex items-start justify-center gap-2 px-4 overflow-x-auto">
        {categories.map((cat, idx) => {
          const color = getCategoryColor(idx);
          const golferId = selections.get(cat.id);
          const golfer = golferId ? golferLookup.get(golferId) : null;
          const isFilled = !!golfer;
          const isActive = cat.id === activeCategoryId && !isFilled;

          // Abbreviate category name to first word or 3 chars
          const shortName = cat.name.length > 6 ? cat.name.slice(0, 5) + "." : cat.name;

          return (
            <button
              key={cat.id}
              onClick={() => onBubbleTap(cat.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group shrink-0"
              aria-label={`${cat.name}: ${isFilled ? golfer!.name : isActive ? "picking now" : "pending"}`}
            >
              {/* Bubble */}
              <span
                className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                  isActive ? "bubble-pulse" : ""
                }`}
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: isFilled ? color.dot : "transparent",
                  border: isFilled
                    ? "none"
                    : isActive
                      ? `2px dashed ${color.dot}`
                      : "1.5px dashed #D4D0C8",
                }}
              >
                {isFilled && (
                  <span className="font-body text-[8px] font-semibold text-white leading-none">
                    {getInitials(golfer!.name)}
                  </span>
                )}
                {isActive && (
                  <span
                    className="font-body text-[10px] font-semibold leading-none"
                    style={{ color: color.text }}
                  >
                    ?
                  </span>
                )}
              </span>

              {/* Category label */}
              <span
                className="text-[6px] font-body text-center leading-tight max-w-[30px] truncate"
                style={{
                  color: isFilled
                    ? "#A39E96"
                    : isActive
                      ? color.text
                      : "#D4D0C8",
                }}
              >
                {shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pulse animation — respects prefers-reduced-motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          .bubble-pulse {
            animation: bubblePulse 1.5s ease-in-out infinite;
          }
        }
        @keyframes bubblePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
