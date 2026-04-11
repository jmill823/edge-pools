"use client";

import { useRef, useCallback } from "react";
import { getCategoryColor, abbreviateName, getInitials, countryToFlag } from "@/lib/golf-utils";

export interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

export interface Category {
  id: string;
  name: string;
  qualifier?: string | null;
  sortOrder: number;
  golfers: Golfer[];
}

export interface SelectionGridProps {
  categories: Category[];
  selections: Map<string, string>;
  golferCategoryCount: Map<string, number>;
  usedGolferIds: Set<string>;
  onSelect: (categoryId: string, golferId: string) => void;
  readOnly: boolean;
  /** Called after a pick with the categoryId — parent handles auto-advance */
  onPickMade?: (categoryId: string) => void;
  /** Ref forwarded so parent can scroll to specific columns */
  gridRef?: React.RefObject<HTMLDivElement>;
}

/**
 * SelectionGrid — golfer pick grid with earth-tone category colors,
 * avatar circles, flag emoji, abbreviated names, and OWGR display.
 */
export function SelectionGrid({
  categories,
  selections,
  golferCategoryCount,
  usedGolferIds,
  onSelect,
  readOnly,
  onPickMade,
  gridRef,
}: SelectionGridProps) {
  const maxRows = Math.max(...categories.map((c) => c.golfers.length), 0);
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = gridRef || internalRef;

  const handleSelect = useCallback(
    (categoryId: string, golferId: string, wasAlreadySelected: boolean) => {
      onSelect(categoryId, golferId);
      // Only trigger auto-advance for new picks, not deselection or changing existing
      if (!wasAlreadySelected && golferId && onPickMade) {
        onPickMade(categoryId);
      }
    },
    [onSelect, onPickMade]
  );

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto flex-1 min-h-0 px-3 sm:px-6"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table className="border-collapse min-w-max">
        {/* Column headers */}
        <thead className="sticky top-0 z-10">
          <tr>
            {categories.map((cat, catIdx) => {
              const color = getCategoryColor(catIdx);
              return (
                <th
                  key={cat.id}
                  data-category-id={cat.id}
                  className="border-b border-r border-border px-2 text-center"
                  style={{
                    backgroundColor: color.fill,
                    minWidth: 90,
                    height: 56,
                  }}
                >
                  <span
                    className="block font-sans text-[11px] font-semibold uppercase tracking-[0.3px]"
                    style={{ color: "var(--neutral-text)" }}
                  >
                    {cat.name}
                  </span>
                  {cat.qualifier && (
                    <span className="block font-sans text-[9px] font-normal mt-0.5" style={{ textTransform: "none", color: "var(--neutral-text)" }}>
                      {cat.qualifier}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {categories.map((cat, catIdx) => {
                const golfer = cat.golfers[rowIdx];
                if (!golfer) {
                  return (
                    <td
                      key={cat.id}
                      className="border-r border-border/50"
                      style={{ minWidth: 90 }}
                    />
                  );
                }

                const color = getCategoryColor(catIdx);
                const isSelected = selections.get(cat.id) === golfer.id;
                const isUsedElsewhere = usedGolferIds.has(golfer.id) && !isSelected;
                const catCount = golferCategoryCount.get(golfer.id) || 1;
                const isMultiCat = catCount > 1;
                const canTap = !readOnly && !isUsedElsewhere;

                const flag = countryToFlag(golfer.country);
                const abbrevName = abbreviateName(golfer.name);
                const initials = getInitials(golfer.name);

                return (
                  <td
                    key={`${cat.id}-${golfer.id}`}
                    className="border-r border-b border-border/50"
                    style={{
                      minWidth: 90,
                      backgroundColor: isSelected
                        ? color.fill
                        : isUsedElsewhere
                          ? undefined
                          : undefined,
                      borderLeft: isSelected ? `3px solid ${color.dot}` : undefined,
                    }}
                  >
                    <button
                      onClick={() => {
                        if (!canTap) return;
                        handleSelect(cat.id, isSelected ? "" : golfer.id, isSelected);
                      }}
                      disabled={!canTap}
                      className={`relative w-full text-left px-2 py-1.5 min-h-[48px] flex items-center gap-1.5 ${
                        canTap ? "cursor-pointer active:opacity-80" : "cursor-default"
                      } ${isUsedElsewhere ? "opacity-30" : ""}`}
                    >
                      {/* Avatar circle */}
                      <span
                        className="shrink-0 flex items-center justify-center rounded-full font-sans text-[9px] font-semibold text-white"
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: isSelected ? color.dot : isUsedElsewhere ? "var(--neutral-border)" : color.dot,
                          outline: isSelected ? "2px solid white" : undefined,
                          outlineOffset: isSelected ? -1 : undefined,
                        }}
                      >
                        {initials}
                      </span>

                      {/* Name + flag — no truncate so flags always show */}
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block font-sans text-[12px] leading-tight break-words ${
                            isSelected
                              ? "font-semibold"
                              : isUsedElsewhere
                                ? "line-through"
                                : "font-normal"
                          }`}
                          style={{
                            color: isSelected ? color.text : isUsedElsewhere ? "var(--neutral-muted)" : "var(--neutral-text)",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {flag && <span className="text-[11px] mr-0.5">{flag}</span>}
                          {abbrevName}
                        </span>
                      </span>

                      {/* OWGR — right-justified inline */}
                      <span className="shrink-0 font-mono text-[10px] text-text-muted tabular-nums">
                        {golfer.owgr ?? "\u2014"}
                      </span>

                      {/* Multi-category badge — circular, bottom-right corner */}
                      {isMultiCat && !isUsedElsewhere && !isSelected && (
                        <span
                          className="absolute bottom-1 right-1 flex items-center justify-center rounded-full font-mono font-bold"
                          style={{
                            width: 16,
                            height: 16,
                            fontSize: 10,
                            color: "var(--neutral-muted)",
                            backgroundColor: "var(--neutral-you-row)",
                          }}
                        >
                          {catCount}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
