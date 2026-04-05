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
  qualifier?: string;
  sortOrder: number;
  golfers: GolferData[];
}

interface CategoryEditorProps {
  categories: CategoryData[];
  availableGolfers: GolferData[];
  onChange: (cats: CategoryData[]) => void;
}

export function CategoryEditor({ categories, availableGolfers, onChange }: CategoryEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
        <div key={idx} className="rounded-card border border-border bg-surface">
          {/* Header */}
          <div className="flex w-full items-center gap-2 px-4 py-3 min-h-[44px]">
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="flex flex-1 items-center gap-2 text-left cursor-pointer min-w-0"
            >
              <span className="font-mono text-xs text-text-muted w-6 shrink-0">{cat.sortOrder}</span>
              <span className="flex-1 font-body font-medium text-text-primary truncate">{cat.name}</span>
              <span className="font-mono text-xs text-text-secondary shrink-0">
                {cat.golfers.length} golfer{cat.golfers.length !== 1 ? "s" : ""}
              </span>
              <svg
                className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${expandedIdx === idx ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Inline edit (rename) */}
            <button
              onClick={() => {
                const newName = prompt("Rename category:", cat.name);
                if (newName && newName.trim()) updateCategory(idx, { ...cat, name: newName.trim() });
              }}
              className="shrink-0 rounded p-1 text-text-muted hover:text-accent-primary hover:bg-surface-alt cursor-pointer transition-colors duration-200"
              aria-label={`Rename ${cat.name}`}
              title="Rename"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* Inline delete */}
            <button
              onClick={() => deleteCategory(idx)}
              className="shrink-0 rounded p-1 text-text-muted hover:text-accent-danger hover:bg-[#FCEAE9] cursor-pointer transition-colors duration-200"
              aria-label={`Delete ${cat.name}`}
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Expanded */}
          {expandedIdx === idx && (
            <div className="border-t border-border px-4 py-3 space-y-3">
              {/* Rename */}
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(idx, { ...cat, name: e.target.value })}
                className="w-full rounded-btn border border-border bg-surface px-3 py-2 font-body text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15"
                placeholder="Category name"
              />

              {/* Golfer list */}
              <div className="space-y-1">
                {cat.golfers.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-data px-2 py-1.5 font-body text-sm hover:bg-surface-alt transition-colors duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-text-primary truncate">{g.name}</span>
                      {g.country && <span className="text-xs text-text-muted">{g.country}</span>}
                      {g.owgr && <span className="font-mono text-xs text-text-muted">#{g.owgr}</span>}
                    </div>
                    <button
                      onClick={() =>
                        updateCategory(idx, { ...cat, golfers: cat.golfers.filter((x) => x.id !== g.id) })
                      }
                      className="ml-2 shrink-0 rounded p-1.5 text-accent-danger hover:bg-[#FCEAE9] cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors duration-200"
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
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => moveCategory(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-data px-2 py-1.5 font-body text-xs text-text-secondary hover:bg-surface-alt disabled:opacity-30 min-h-[32px] cursor-pointer transition-colors duration-200"
                >
                  Move Up
                </button>
                <button
                  onClick={() => moveCategory(idx, 1)}
                  disabled={idx === categories.length - 1}
                  className="rounded-data px-2 py-1.5 font-body text-xs text-text-secondary hover:bg-surface-alt disabled:opacity-30 min-h-[32px] cursor-pointer transition-colors duration-200"
                >
                  Move Down
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => deleteCategory(idx)}
                  className="rounded-data px-2 py-1.5 font-body text-xs text-accent-danger hover:bg-[#FCEAE9] min-h-[32px] cursor-pointer transition-colors duration-200"
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
        className="w-full rounded-card border-2 border-dashed border-border py-3 font-body text-sm font-medium text-accent-primary hover:border-accent-primary/40 hover:bg-surface-alt min-h-[44px] cursor-pointer transition-colors duration-200"
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
        className="w-full rounded-btn border border-border bg-surface px-3 py-2 font-body text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15"
      />
      {open && query && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-subtle">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => { onSelect(g); setQuery(""); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 font-body text-sm text-left hover:bg-surface-alt min-h-[40px] cursor-pointer transition-colors duration-150"
            >
              <span className="flex-1 truncate text-text-primary">{g.name}</span>
              {g.country && <span className="text-xs text-text-muted">{g.country}</span>}
              {g.owgr && <span className="font-mono text-xs text-text-muted">#{g.owgr}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
