"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryEditor, CategoryData, GolferData } from "@/components/CategoryEditor";

interface Tournament {
  id: string;
  name: string;
  course: string | null;
  startDate: string;
  endDate: string;
}

interface Template {
  templateName: string;
  categories: {
    name: string;
    sortOrder: number;
    golferNames: string[];
  }[];
}

export default function CreatePoolPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allGolfers, setAllGolfers] = useState<GolferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [tournamentId, setTournamentId] = useState("");
  const [poolName, setPoolName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [picksDeadline, setPicksDeadline] = useState("");
  const [maxEntries, setMaxEntries] = useState(1);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [rules, setRules] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/golfers").then((r) => r.json()),
    ]).then(([t, tmpl, g]) => {
      setTournaments(t);
      setTemplates(tmpl);
      setAllGolfers(g);
      if (t.length > 0) {
        setTournamentId(t[0].id);
        // Default deadline to tournament start
        setPicksDeadline(formatDateTimeLocal(t[0].startDate));
      }
      setLoading(false);
    });
  }, []);

  function handleTournamentChange(id: string) {
    setTournamentId(id);
    const t = tournaments.find((x) => x.id === id);
    if (t) setPicksDeadline(formatDateTimeLocal(t.startDate));
  }

  function handleTemplateSelect(templateName: string) {
    setSelectedTemplate(templateName);
    const tmpl = templates.find((t) => t.templateName === templateName);
    if (!tmpl) return;

    const golferMap = new Map(allGolfers.map((g) => [g.name, g]));
    const cats: CategoryData[] = tmpl.categories.map((c) => ({
      name: c.name,
      sortOrder: c.sortOrder,
      golfers: c.golferNames
        .map((name) => golferMap.get(name))
        .filter((g): g is GolferData => !!g),
    }));
    setCategories(cats);
  }

  async function handleSubmit() {
    if (!tournamentId || !poolName || categories.length === 0) return;
    setSubmitting(true);

    const res = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: poolName,
        tournamentId,
        categories: categories.map((c) => ({
          name: c.name,
          sortOrder: c.sortOrder,
          golferIds: c.golfers.map((g) => g.id),
        })),
        picksDeadline,
        maxEntries: allowMultiple ? maxEntries : 1,
        rules: rules || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to create pool");
      setSubmitting(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/pool/${id}/invite`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900">Create a Pool</h1>
      <p className="mt-1 text-sm text-green-600">
        Set up your pool in a few steps.
      </p>

      <div className="mt-8 space-y-8">
        {/* 1. Tournament */}
        <section>
          <label className="block text-sm font-semibold text-green-900">
            1. Select Tournament
          </label>
          <select
            value={tournamentId}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="mt-2 w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.course} ({formatDate(t.startDate)} –{" "}
                {formatDate(t.endDate)})
              </option>
            ))}
          </select>
        </section>

        {/* 2. Pool name */}
        <section>
          <label className="block text-sm font-semibold text-green-900">
            2. Name Your Pool
          </label>
          <input
            type="text"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="e.g., Mike's Masters Pool 2026"
            className="mt-2 w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </section>

        {/* 3. Template */}
        <section>
          <label className="block text-sm font-semibold text-green-900">
            3. Select Template
          </label>
          <div className="mt-2 space-y-2">
            {templates.map((t) => (
              <button
                key={t.templateName}
                onClick={() => handleTemplateSelect(t.templateName)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedTemplate === t.templateName
                    ? "border-green-600 bg-green-50"
                    : "border-green-200 hover:border-green-400"
                }`}
              >
                <div className="font-medium text-green-900">
                  {t.templateName}
                </div>
                <div className="mt-1 text-xs text-green-600">
                  {t.categories.length} categories:{" "}
                  {t.categories.map((c) => c.name).join(", ")}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Category editor */}
        {categories.length > 0 && (
          <section>
            <label className="block text-sm font-semibold text-green-900 mb-3">
              4. Review & Edit Categories
            </label>
            <CategoryEditor
              categories={categories}
              availableGolfers={allGolfers}
              onChange={setCategories}
            />
          </section>
        )}

        {/* 5. Picks deadline */}
        <section>
          <label className="block text-sm font-semibold text-green-900">
            5. Picks Deadline
          </label>
          <input
            type="datetime-local"
            value={picksDeadline}
            onChange={(e) => setPicksDeadline(e.target.value)}
            className="mt-2 w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </section>

        {/* 6. Max entries */}
        <section>
          <label className="flex items-center gap-2 text-sm font-semibold text-green-900">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => {
                setAllowMultiple(e.target.checked);
                if (!e.target.checked) setMaxEntries(1);
              }}
              className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            6. Allow multiple entries per player?
          </label>
          {allowMultiple && (
            <input
              type="number"
              min={2}
              max={5}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Number(e.target.value))}
              className="mt-2 w-24 rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          )}
        </section>

        {/* 7. Rules */}
        <section>
          <label className="block text-sm font-semibold text-green-900">
            7. House Rules (optional)
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Prize structure, tiebreakers, etc."
            rows={3}
            className="mt-2 w-full rounded border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!poolName || !tournamentId || categories.length === 0 || submitting}
          className="w-full rounded-md bg-green-800 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating Pool..." : "Create Pool"}
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
