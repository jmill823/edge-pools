"use client";

import { useState, useRef, useEffect } from "react";

export interface GolferData {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
}

export interface CategoryData {
  name: string;
  sortOrder: number;
  golfers: GolferData[];
}

interface CategoryEditorProps {
  categories: CategoryData[];
  availableGolfers: GolferData[];
  onChange: (cats: CategoryData[]) => void;
}

export function CategoryEditor({ categories, availableGolfers, onChange }: CategoryEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  function updateCategory(idx: number, updated: CategoryData) {
    const next = [...categories];
    next[idx] = updated;
    onChange(next);
  }

  function deleteCategory(idx: number) {
    if (!confirm(`Delete category "${categories[idx].name}"?`)) return;
    const next = categories.filter((_, i) => i !== idx);
    next.forEach((c, i) => (c.sortOrder = i + 1));
    onChange(next);
    setExpandedIdx(null);
  }

  function addCategory() {
    const next = [
      ...categories,
      { name: "New Category", sortOrder: categories.length + 1, golfers: [] },
    ];
    onChange(next);
    setExpandedIdx(next.length - 1);
  }

  function moveCategory(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((c, i) => (c.sortOrder = i + 1));
    onChange(next);
    setExpandedIdx(target);
  }

  return (
    <div className="space-y-3">
      {categories.map((cat, idx) => (
        <div key={idx} className="rounded-lg border border-green-200 bg-white">
          {/* Header */}
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left min-h-[44px]"
          >
            <span className="text-xs text-green-600 font-mono w-6">{cat.sortOrder}</span>
            <span className="flex-1 font-medium text-green-900 truncate">{cat.name}</span>
            <span className="text-xs text-green-600">
              {cat.golfers.length} golfer{cat.golfers.length !== 1 ? "s" : ""}
            </span>
            <svg
              className={`w-4 h-4 text-green-600 transition-transform ${expandedIdx === idx ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded */}
          {expandedIdx === idx && (
            <div className="border-t border-green-100 px-4 py-3 space-y-3">
              {/* Rename */}
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(idx, { ...cat, name: e.target.value })}
                className="w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="Category name"
              />

              {/* Golfer list */}
              <div className="space-y-1">
                {cat.golfers.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-green-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-green-900 truncate">{g.name}</span>
                      {g.country && <span className="text-xs text-green-500">{g.country}</span>}
                      {g.owgr && <span className="text-xs text-green-400">#{g.owgr}</span>}
                    </div>
                    <button
                      onClick={() =>
                        updateCategory(idx, { ...cat, golfers: cat.golfers.filter((x) => x.id !== g.id) })
                      }
                      className="ml-2 shrink-0 rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label={`Remove ${g.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add golfer */}
              <GolferSearch
                golfers={availableGolfers}
                currentCategoryGolferIds={new Set(cat.golfers.map((g) => g.id))}
                onSelect={(g) => updateCategory(idx, { ...cat, golfers: [...cat.golfers, g] })}
              />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-green-100">
                <button
                  onClick={() => moveCategory(idx, -1)}
                  disabled={idx === 0}
                  className="rounded px-2 py-1.5 text-xs text-green-700 hover:bg-green-100 disabled:opacity-30 min-h-[32px]"
                >
                  Move Up
                </button>
                <button
                  onClick={() => moveCategory(idx, 1)}
                  disabled={idx === categories.length - 1}
                  className="rounded px-2 py-1.5 text-xs text-green-700 hover:bg-green-100 disabled:opacity-30 min-h-[32px]"
                >
                  Move Down
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => deleteCategory(idx)}
                  className="rounded px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 min-h-[32px]"
                >
                  Delete Category
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addCategory}
        className="w-full rounded-lg border-2 border-dashed border-green-300 py-3 text-sm font-medium text-green-700 hover:border-green-500 hover:text-green-900 min-h-[44px]"
      >
        + Add Category
      </button>
    </div>
  );
}

function GolferSearch({
  golfers,
  currentCategoryGolferIds,
  onSelect,
}: {
  golfers: GolferData[];
  currentCategoryGolferIds: Set<string>;
  onSelect: (g: GolferData) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = golfers
    .filter((g) => !currentCategoryGolferIds.has(g.id) && g.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query && setOpen(true)}
        placeholder="Search golfers to add..."
        className="w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
      />
      {open && query && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-green-200 bg-white shadow-lg">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => { onSelect(g); setQuery(""); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-green-50 min-h-[40px]"
            >
              <span className="flex-1 truncate text-green-900">{g.name}</span>
              {g.country && <span className="text-xs text-green-500">{g.country}</span>}
              {g.owgr && <span className="text-xs text-green-400">#{g.owgr}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
