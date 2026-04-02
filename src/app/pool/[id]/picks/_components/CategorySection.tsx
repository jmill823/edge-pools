"use client";

import { useRef, useEffect } from "react";

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

interface CategorySectionProps {
  categoryId: string;
  categoryName: string;
  sortOrder: number;
  golfers: Golfer[];
  selectedGolferId: string | null;
  pickedElsewhere: Set<string>;
  onSelect: (categoryId: string, golferId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  shouldScrollTo: boolean;
  readOnly?: boolean;
}

export function CategorySection({
  categoryId,
  categoryName,
  golfers,
  selectedGolferId,
  pickedElsewhere,
  onSelect,
  isExpanded,
  onToggle,
  shouldScrollTo,
  readOnly = false,
}: CategorySectionProps) {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollTo && headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [shouldScrollTo]);

  const selectedGolfer = golfers.find((g) => g.id === selectedGolferId);

  return (
    <div className="border-b border-green-100 last:border-b-0">
      {/* Sticky header */}
      <div
        ref={headerRef}
        onClick={readOnly ? undefined : onToggle}
        className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-green-100 min-h-[44px] ${readOnly ? "" : "cursor-pointer"}`}
        style={{ scrollMarginTop: "0px" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-green-900 truncate">{categoryName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedGolfer ? (
            <span className="text-xs font-medium text-green-700 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="max-w-[120px] truncate">{selectedGolfer.name}</span>
            </span>
          ) : (
            <span className="text-xs text-green-500">Select a golfer</span>
          )}
          {!readOnly && (
            <svg
              className={`w-4 h-4 text-green-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Golfer list */}
      {isExpanded && (
        <div className="divide-y divide-green-50">
          {golfers.map((g) => {
            const isSelected = g.id === selectedGolferId;
            const isDisabled = pickedElsewhere.has(g.id);

            return (
              <button
                key={g.id}
                onClick={() => {
                  if (readOnly || isDisabled) return;
                  onSelect(categoryId, isSelected ? "" : g.id);
                }}
                disabled={readOnly || isDisabled}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition min-h-[44px] ${
                  isSelected
                    ? "bg-green-50 border-l-4 border-green-600"
                    : isDisabled
                      ? "bg-gray-50 opacity-50 cursor-not-allowed"
                      : "hover:bg-green-50/50 border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isSelected && (
                    <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="min-w-0">
                    <span className={`block text-sm font-medium truncate ${isSelected ? "text-green-900" : isDisabled ? "text-gray-400" : "text-green-900"}`}>
                      {g.name}
                    </span>
                    {isDisabled && (
                      <span className="text-xs text-gray-400">Already picked</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs text-green-500">
                  {g.country && <span>{g.country}</span>}
                  {g.owgr && <span>#{g.owgr}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
