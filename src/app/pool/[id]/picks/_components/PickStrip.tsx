"use client";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface Golfer {
  id: string;
  name: string;
}

interface PickStripProps {
  categories: Category[];
  selections: Map<string, string>;
  golferLookup: Map<string, Golfer>;
}

export function PickStrip({ categories, selections, golferLookup }: PickStripProps) {
  return (
    <div className="overflow-x-auto border-b border-green-200 bg-white">
      <div className="flex min-w-max px-2 py-2 gap-1.5">
        {categories.map((cat) => {
          const golferId = selections.get(cat.id);
          const golfer = golferId ? golferLookup.get(golferId) : null;
          const picked = !!golfer;

          return (
            <div
              key={cat.id}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-center min-w-[80px] ${
                picked ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="text-[10px] text-green-500 truncate leading-tight">{cat.name}</div>
              <div className={`text-xs font-medium truncate mt-0.5 leading-tight ${
                picked ? "text-green-800" : "text-gray-400"
              }`}>
                {golfer ? lastName(golfer.name) : "\u2014"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function lastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
