"use client";

export interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

export interface Category {
  id: string;
  name: string;
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
}

/**
 * SelectionGrid — golfer pick grid used on picks page and inline edit.
 *
 * Layout rules:
 * - ≤9 categories on desktop: columns fill available width, no horizontal scroll
 * - >9 categories OR mobile: horizontal scroll enabled with min-width per column
 * - 20-30px padding on each side of the grid
 */
export function SelectionGrid({
  categories,
  selections,
  golferCategoryCount,
  usedGolferIds,
  onSelect,
  readOnly,
}: SelectionGridProps) {
  const maxRows = Math.max(...categories.map((c) => c.golfers.length), 0);
  const fitsDesktop = categories.length <= 9;

  return (
    <div className="overflow-x-auto flex-1 min-h-0 px-5 sm:px-8 -webkit-overflow-scrolling-touch">
      <table
        className={`border-collapse ${
          fitsDesktop ? "w-full sm:w-full sm:table-fixed" : "min-w-max"
        }`}
      >
        {/* Sticky column headers */}
        <thead className="sticky top-0 z-10">
          <tr>
            {categories.map((cat) => (
              <th
                key={cat.id}
                className={`bg-surface border-b border-r border-border px-2 py-2 font-display text-[9px] font-medium text-text-muted text-center uppercase tracking-[0.5px] ${
                  fitsDesktop ? "" : "min-w-[100px] max-w-[120px]"
                }`}
              >
                {cat.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {categories.map((cat) => {
                const golfer = cat.golfers[rowIdx];
                if (!golfer) {
                  return (
                    <td
                      key={cat.id}
                      className={`border-r border-border/50 ${
                        fitsDesktop ? "" : "min-w-[100px] max-w-[120px]"
                      }`}
                    />
                  );
                }

                const isSelected = selections.get(cat.id) === golfer.id;
                const isUsedElsewhere = usedGolferIds.has(golfer.id) && !isSelected;
                const catCount = golferCategoryCount.get(golfer.id) || 1;
                const isMultiCat = catCount > 1;
                const canTap = !readOnly && !isUsedElsewhere;

                return (
                  <td
                    key={`${cat.id}-${golfer.id}`}
                    className={`border-r border-b border-border/50 ${
                      fitsDesktop ? "" : "min-w-[100px] max-w-[120px]"
                    } ${
                      isSelected
                        ? "bg-accent-primary"
                        : isUsedElsewhere
                          ? "bg-surface-alt"
                          : isMultiCat
                            ? "bg-[#FDF4E3]/50"
                            : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!canTap) return;
                        onSelect(cat.id, isSelected ? "" : golfer.id);
                      }}
                      disabled={!canTap}
                      className={`w-full text-left px-2 py-2.5 min-h-[44px] font-body text-[13px] leading-tight ${
                        canTap ? "cursor-pointer active:bg-accent-primary/20" : "cursor-default"
                      }`}
                    >
                      <span
                        className={`block break-words ${
                          isSelected
                            ? "font-bold text-white"
                            : isUsedElsewhere
                              ? "text-text-muted line-through"
                              : "text-text-primary"
                        }`}
                      >
                        {isSelected && <span className="text-white">● </span>}
                        {golfer.name}
                      </span>
                      {isMultiCat && !isUsedElsewhere && !isSelected && (
                        <span className="font-mono text-[9px] font-bold text-accent-secondary align-super ml-0.5">
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
