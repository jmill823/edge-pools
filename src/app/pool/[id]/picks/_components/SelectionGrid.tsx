"use client";

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  golfers: Golfer[];
}

interface SelectionGridProps {
  categories: Category[];
  selections: Map<string, string>;
  golferCategoryCount: Map<string, number>;
  usedGolferIds: Set<string>;
  onSelect: (categoryId: string, golferId: string) => void;
  readOnly: boolean;
}

export function SelectionGrid({
  categories,
  selections,
  golferCategoryCount,
  usedGolferIds,
  onSelect,
  readOnly,
}: SelectionGridProps) {
  const maxRows = Math.max(...categories.map((c) => c.golfers.length), 0);

  return (
    <div className="overflow-x-auto flex-1 min-h-0">
      <table className="border-collapse min-w-max">
        {/* Sticky column headers */}
        <thead className="sticky top-0 z-10">
          <tr>
            {categories.map((cat) => (
              <th
                key={cat.id}
                className="bg-green-50 border-b border-r border-green-200 px-2 py-2 text-[10px] font-semibold text-green-600 text-center uppercase tracking-wide min-w-[100px] max-w-[120px]"
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
                    <td key={cat.id} className="border-r border-green-100 min-w-[100px] max-w-[120px]" />
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
                    className={`border-r border-b border-green-100 min-w-[100px] max-w-[120px] ${
                      isSelected
                        ? "bg-green-100"
                        : isUsedElsewhere
                          ? "bg-gray-50"
                          : isMultiCat
                            ? "bg-amber-50/50"
                            : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!canTap) return;
                        onSelect(cat.id, isSelected ? "" : golfer.id);
                      }}
                      disabled={!canTap}
                      className={`w-full text-left px-2 py-2.5 min-h-[44px] text-xs leading-tight ${
                        canTap ? "cursor-pointer active:bg-green-200" : "cursor-default"
                      }`}
                    >
                      <span
                        className={`block truncate ${
                          isSelected
                            ? "font-bold text-green-800"
                            : isUsedElsewhere
                              ? "text-gray-400 line-through"
                              : "text-green-900"
                        }`}
                      >
                        {isSelected && <span className="text-green-600">● </span>}
                        {golfer.name}
                      </span>
                      {isMultiCat && !isUsedElsewhere && !isSelected && (
                        <span className="text-[9px] font-bold text-amber-600 align-super ml-0.5">
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
