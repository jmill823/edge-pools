"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { TemplateSelector } from "./_components/TemplateSelector";
import { CategoryEditor, CategoryData, GolferData } from "./_components/CategoryEditor";
import { ScoringConfig } from "@/components/ui/ScoringConfig";

interface Tournament {
  id: string;
  name: string;
  course: string | null;
  startDate: string;
  endDate: string;
}

interface Template {
  templateName: string;
  categories: { name: string; qualifier?: string; sortOrder: number; golferNames: string[] }[];
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
  const [rules, setRules] = useState("");
  const [scoringConfig, setScoringConfig] = useState({
    scoringType: "to-par",
    missedCutPenaltyType: "carry-score",
    missedCutFixedPenalty: 4 as number | null,
    tiebreakerRule: "entry-timestamp",
    rosterRule: "all-play",
    rosterRuleMode: "per-tournament",
    rosterRuleCount: null as number | null,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/golfers").then((r) => r.json()),
    ]).then(([t, tmpl, g]) => {
      // Sort tournaments: current/upcoming first, past hidden
      const now = new Date();
      const sorted = (t as Tournament[])
        .filter((x) => new Date(x.endDate) >= now) // hide past tournaments
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      // Find current week's tournament (started or starting within 7 days)
      const currentWeek = sorted.find((x) => {
        const start = new Date(x.startDate);
        const end = new Date(x.endDate);
        return (start <= now && end >= now) || (start > now && start.getTime() - now.getTime() <= 7 * 86400000);
      });
      const defaultTournament = currentWeek || sorted[0];

      setTournaments(sorted);
      setTemplates(tmpl);
      setAllGolfers(g);
      if (defaultTournament) {
        setTournamentId(defaultTournament.id);
        setPicksDeadline(toDateTimeLocal(defaultTournament.startDate));
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
        qualifier: c.qualifier,
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
            qualifier: c.qualifier || undefined,
            sortOrder: c.sortOrder,
            golferIds: c.golfers.map((g) => g.id),
          })),
          picksDeadline: new Date(picksDeadline).toISOString(),
          maxEntries,
          rules: rules.trim() || undefined,
          ...scoringConfig,
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
      <div className="mx-auto max-w-content px-4 py-8">
        <LoadingSkeleton variant="page" lines={6} />
      </div>
    );
  }

  const canSubmit = !!tournamentId && !!poolName.trim() && categories.length > 0 && !submitting;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="font-sans text-2xl font-bold text-text-primary">Create a Pool</h1>
      <p className="mt-1 font-sans text-sm text-text-secondary">Set up your pool in a few steps.</p>

      {error && (
        <div className="mt-4">
          <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-8 space-y-8">
        {/* 1. Tournament */}
        <Section num="1" label="Select Tournament">
          <div className="space-y-1.5">
            {tournaments.map((t, idx) => {
              const isDefault = idx === 0;
              const isGhosted = idx > 0 && idx <= 3;
              const isHidden = idx > 3;
              if (isHidden) return null;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTournamentChange(t.id)}
                  className={`w-full rounded-card border p-3 text-left transition-all duration-200 min-h-[44px] cursor-pointer ${
                    tournamentId === t.id
                      ? "border-[#10B981] bg-[#ECFDF5]"
                      : "border-border hover:border-[#10B981]/40"
                  } ${isGhosted && tournamentId !== t.id ? "opacity-50" : ""}`}
                >
                  <div className={`font-sans font-medium text-text-primary ${isGhosted && tournamentId !== t.id ? "text-xs" : "text-sm"}`}>
                    {t.name}
                    {isDefault && <span className="ml-2 text-[10px] font-mono text-[#10B981] uppercase">This Week</span>}
                  </div>
                  <div className="mt-0.5 font-sans text-xs text-text-secondary">
                    {t.course && <>{t.course} · </>}
                    {fmtDate(t.startDate)} – {fmtDate(t.endDate)}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 2. Pool name */}
        <Section num="2" label="Name Your Pool">
          <input
            type="text"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="e.g., Mike's Masters Pool 2026"
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 min-h-[44px]"
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

        {/* 5. Deadline + Max entries side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section num="5" label="Picks Deadline">
            <input
              type="datetime-local"
              value={picksDeadline}
              onChange={(e) => setPicksDeadline(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 min-h-[44px]"
            />
          </Section>

          <Section num="6" label="Max Entries per Player">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMaxEntries((v) => Math.max(1, v - 1))}
                disabled={maxEntries <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-btn border border-border font-sans text-lg font-bold text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
              >
                &minus;
              </button>
              <span className="font-mono text-lg font-bold text-text-primary w-6 text-center">{maxEntries}</span>
              <button
                type="button"
                onClick={() => setMaxEntries((v) => Math.min(5, v + 1))}
                disabled={maxEntries >= 5}
                className="flex h-11 w-11 items-center justify-center rounded-btn border border-border font-sans text-lg font-bold text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
              >
                +
              </button>
            </div>
            {maxEntries > 1 && (
              <p className="mt-2 font-sans text-xs text-text-muted">Players can submit up to {maxEntries} entries</p>
            )}
          </Section>
        </div>

        {/* 7. Scoring Configuration */}
        <Section num="7" label="Scoring Configuration">
          <ScoringConfig
            scoringType={scoringConfig.scoringType}
            missedCutPenaltyType={scoringConfig.missedCutPenaltyType}
            missedCutFixedPenalty={scoringConfig.missedCutFixedPenalty}
            tiebreakerRule={scoringConfig.tiebreakerRule}
            rosterRule={scoringConfig.rosterRule}
            rosterRuleMode={scoringConfig.rosterRuleMode}
            rosterRuleCount={scoringConfig.rosterRuleCount}
            categoryCount={categories.length || 9}
            onChange={setScoringConfig}
          />
        </Section>

        {/* 8. Rules */}
        <Section num="8" label="House Rules (Optional)">
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Prize structure, tiebreakers, etc."
            rows={3}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15"
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
      <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
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
