"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { TemplateSelector } from "./_components/TemplateSelector";
import { CategoryEditor, CategoryData, GolferData } from "./_components/CategoryEditor";

interface Tournament {
  id: string;
  name: string;
  course: string | null;
  startDate: string;
  endDate: string;
}

interface Template {
  templateName: string;
  categories: { name: string; sortOrder: number; golferNames: string[] }[];
}

export default function CreatePoolPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allGolfers, setAllGolfers] = useState<GolferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tournamentId, setTournamentId] = useState("");
  const [poolName, setPoolName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
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
        setPicksDeadline(toDateTimeLocal(t[0].startDate));
      }
      setLoading(false);
    }).catch(() => { setError("Failed to load data"); setLoading(false); });
  }, []);

  function handleTournamentChange(id: string) {
    setTournamentId(id);
    const t = tournaments.find((x) => x.id === id);
    if (t) setPicksDeadline(toDateTimeLocal(t.startDate));
  }

  function handleTemplateSelect(templateName: string) {
    setSelectedTemplate(templateName);
    const tmpl = templates.find((t) => t.templateName === templateName);
    if (!tmpl) return;
    const golferMap = new Map(allGolfers.map((g) => [g.name, g]));
    setCategories(
      tmpl.categories.map((c) => ({
        name: c.name,
        sortOrder: c.sortOrder,
        golfers: c.golferNames.map((n) => golferMap.get(n)).filter((g): g is GolferData => !!g),
      }))
    );
  }

  async function handleSubmit() {
    if (!tournamentId || !poolName.trim() || categories.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: poolName.trim(),
          tournamentId,
          categories: categories.map((c) => ({
            name: c.name,
            sortOrder: c.sortOrder,
            golferIds: c.golfers.map((g) => g.id),
          })),
          picksDeadline: new Date(picksDeadline).toISOString(),
          maxEntries: allowMultiple ? maxEntries : 1,
          rules: rules.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to create pool" }));
        setError(data.error || "Failed to create pool");
        setSubmitting(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/pool/${id}/invite`);
    } catch {
      setError("Failed to create pool. Check your connection.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <LoadingSkeleton variant="page" lines={6} />
      </div>
    );
  }

  const canSubmit = !!tournamentId && !!poolName.trim() && categories.length > 0 && !submitting;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900">Create a Pool</h1>
      <p className="mt-1 text-sm text-green-600">Set up your pool in a few steps.</p>

      {error && (
        <div className="mt-4">
          <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-8 space-y-8">
        {/* 1. Tournament */}
        <Section num="1" label="Select Tournament">
          <select
            value={tournamentId}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="w-full rounded-md border border-green-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[44px]"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.course} ({fmtDate(t.startDate)} – {fmtDate(t.endDate)})
              </option>
            ))}
          </select>
        </Section>

        {/* 2. Pool name */}
        <Section num="2" label="Name Your Pool">
          <input
            type="text"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="e.g., Mike's Masters Pool 2026"
            className="w-full rounded-md border border-green-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[44px]"
          />
        </Section>

        {/* 3. Template */}
        <Section num="3" label="Select Template">
          <TemplateSelector templates={templates} selected={selectedTemplate} onSelect={handleTemplateSelect} />
        </Section>

        {/* 4. Categories */}
        {categories.length > 0 && (
          <Section num="4" label="Review & Edit Categories">
            <CategoryEditor categories={categories} availableGolfers={allGolfers} onChange={setCategories} />
          </Section>
        )}

        {/* 5. Deadline */}
        <Section num="5" label="Picks Deadline">
          <input
            type="datetime-local"
            value={picksDeadline}
            onChange={(e) => setPicksDeadline(e.target.value)}
            className="w-full rounded-md border border-green-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[44px]"
          />
        </Section>

        {/* 6. Max entries */}
        <Section num="6" label="Multiple Entries">
          <label className="flex items-center gap-2 text-sm text-green-900 min-h-[44px]">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => { setAllowMultiple(e.target.checked); if (!e.target.checked) setMaxEntries(1); }}
              className="h-5 w-5 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            Allow multiple entries per player?
          </label>
          {allowMultiple && (
            <input
              type="number"
              min={2}
              max={5}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Math.max(2, Math.min(5, Number(e.target.value))))}
              className="mt-2 w-24 rounded-md border border-green-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none min-h-[44px]"
            />
          )}
        </Section>

        {/* 7. Rules */}
        <Section num="7" label="House Rules (Optional)">
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Prize structure, tiebreakers, etc."
            rows={3}
            className="w-full rounded-md border border-green-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </Section>

        {/* Submit */}
        <Button variant="primary" className="w-full" loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>
          Create Pool
        </Button>
      </div>
    </div>
  );
}

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <section>
      <label className="block text-sm font-semibold text-green-900">
        {num}. {label}
      </label>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
