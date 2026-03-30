"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
  slashGolfId: string | null;
}

export default function GolferMappingPage() {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/golfer-mapping")
      .then((r) => r.json())
      .then(setGolfers);
  }, []);

  async function updateMapping(id: string, slashGolfId: string) {
    setSaving(id);
    await fetch(`/api/admin/golfers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slashGolfId: slashGolfId.trim() || null }),
    });
    setGolfers((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, slashGolfId: slashGolfId.trim() || null } : g
      )
    );
    setSaving(null);
  }

  const filtered = golfers.filter((g) =>
    g.name.toLowerCase().includes(filter.toLowerCase())
  );

  const unmapped = golfers.filter((g) => !g.slashGolfId).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            Golfer ID Mapping
          </h1>
          <p className="text-sm text-green-600">
            Map Edge Pools golfers to SlashGolf player IDs ·{" "}
            <span className={unmapped > 0 ? "text-amber-600 font-medium" : "text-green-600"}>
              {unmapped} unmapped
            </span>
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-green-700 hover:text-green-900"
        >
          ← Dashboard
        </Link>
      </div>

      <input
        type="text"
        placeholder="Filter golfers..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 w-full rounded border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-400 focus:outline-none"
      />

      <div className="space-y-1">
        {filtered.map((g) => (
          <div
            key={g.id}
            className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${
              g.slashGolfId ? "bg-white" : "bg-amber-50"
            }`}
          >
            <div className="w-8 text-right text-xs text-green-500">
              {g.owgr ?? "—"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-green-900">{g.name}</span>
              {g.country && (
                <span className="ml-1 text-xs text-green-500">
                  ({g.country})
                </span>
              )}
            </div>
            <input
              type="text"
              defaultValue={g.slashGolfId ?? ""}
              placeholder="SlashGolf ID"
              className="w-28 rounded border border-green-200 px-2 py-1 text-xs text-green-900 focus:border-green-400 focus:outline-none"
              onBlur={(e) => {
                if (e.target.value !== (g.slashGolfId ?? "")) {
                  updateMapping(g.id, e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            {saving === g.id && (
              <span className="text-xs text-green-500">saving...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
