"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { TemplateSelector } from "./TemplateSelector";
import { CategoryEditor, CategoryData, GolferData } from "./CategoryEditor";
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

export function CreatePoolForm() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allGolfers, setAllGolfers] = useState<GolferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

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
      const now = new Date();
      const sorted = (t as Tournament[])
        .filter((x) => new Date(x.endDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

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
        setPoolName(`${defaultTournament.name} Pool`);
      }
      setLoading(false);
    }).catch(() => { setError("Failed to load data"); setLoading(false); });
  }, []);

  function handleTournamentSelect(id: string) {
    setTournamentId(id);
    const t = tournaments.find((x) => x.id === id);
    if (t) {
      setPicksDeadline(toDateTimeLocal(t.startDate));
      if (!poolName || poolName.endsWith(" Pool")) setPoolName(`${t.name} Pool`);
    }
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

  if (loading) return null;

  const canSubmit = !!tournamentId && !!poolName.trim() && categories.length > 0 && !submitting;

  return (
    <div className="space-y-4">
      {error && <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />}

      {/* Tournament */}
      {tournaments.length === 0 ? (
        <p className="font-sans text-[13px] text-[#A39E96] py-4 text-center">
          No upcoming tournaments available. Check back when the next PGA event is scheduled.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">Tournament</p>
          <div className="grid grid-cols-2 gap-2">
            {tournaments.slice(0, 4).map((t, idx) => {
              const isSelected = tournamentId === t.id;
              const isFirstWeek = idx === 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTournamentSelect(t.id)}
                  className={`text-left bg-white border rounded-[6px] p-[10px] transition-all duration-200 cursor-pointer ${
                    isSelected ? "border-[#B09A60] border-2" : "border-[#E2DDD5] hover:border-[#B09A60]/40"
                  } ${!isFirstWeek && !isSelected ? "opacity-60" : ""}`}
                >
                  <p className="font-sans text-[12px] font-medium text-[#1A1A18] truncate">{t.name}</p>
                  {isFirstWeek && <span className="font-mono text-[8px] text-[#B09A60] uppercase">This Week</span>}
                  <p className="font-sans text-[9px] text-[#A39E96] mt-0.5">
                    {t.course && <>{t.course} · </>}
                    {fmtDate(t.startDate)} – {fmtDate(t.endDate)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Template */}
      <div className="space-y-2">
        <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">Template</p>
        <TemplateSelector templates={templates} selected={selectedTemplate} onSelect={handleTemplateSelect} />
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">Settings</p>
        <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-3 space-y-3">
          <div>
            <label className="block font-sans text-[10px] font-medium text-[#6B6560] mb-1">Pool name</label>
            <input type="text" value={poolName} onChange={(e) => setPoolName(e.target.value)} placeholder="e.g., Masters Pool 2026"
              className="w-full rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-sans text-[13px] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 min-h-[44px]" />
          </div>
          <div>
            <label className="block font-sans text-[10px] font-medium text-[#6B6560] mb-1">Picks deadline</label>
            <input type="datetime-local" value={picksDeadline} onChange={(e) => setPicksDeadline(e.target.value)}
              className="w-full rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-mono text-[13px] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 min-h-[44px]" />
          </div>
          <div>
            <label className="block font-sans text-[10px] font-medium text-[#6B6560] mb-1">Max entries per player</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMaxEntries((v) => Math.max(1, v - 1))} disabled={maxEntries <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E2DDD5] font-sans text-lg font-bold text-[#6B6560] hover:bg-[#F5F2EB] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200">−</button>
              <span className="font-mono text-[16px] font-bold text-[#1A1A18] w-6 text-center">{maxEntries}</span>
              <button type="button" onClick={() => setMaxEntries((v) => Math.min(5, v + 1))} disabled={maxEntries >= 5}
                className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E2DDD5] font-sans text-lg font-bold text-[#6B6560] hover:bg-[#F5F2EB] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200">+</button>
            </div>
          </div>
          <div>
            <label className="block font-sans text-[10px] font-medium text-[#6B6560] mb-1">Scoring</label>
            <ScoringConfig scoringType={scoringConfig.scoringType} missedCutPenaltyType={scoringConfig.missedCutPenaltyType}
              missedCutFixedPenalty={scoringConfig.missedCutFixedPenalty} tiebreakerRule={scoringConfig.tiebreakerRule}
              rosterRule={scoringConfig.rosterRule} rosterRuleMode={scoringConfig.rosterRuleMode}
              rosterRuleCount={scoringConfig.rosterRuleCount} categoryCount={categories.length || 9} onChange={setScoringConfig} />
          </div>
          {!showRules ? (
            <button onClick={() => setShowRules(true)} className="font-sans text-[11px] text-[#1B5E3B] cursor-pointer hover:underline">+ Add house rules</button>
          ) : (
            <div>
              <label className="block font-sans text-[10px] font-medium text-[#6B6560] mb-1">House rules (optional)</label>
              <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Prize structure, tiebreakers, etc." rows={3}
                className="w-full rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-sans text-[13px] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 resize-none" />
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">
            Categories <span className="ml-1 normal-case text-[#6B6560]">· {categories.length} from {selectedTemplate}</span>
          </p>
          <CategoryEditor categories={categories} availableGolfers={allGolfers} onChange={setCategories} />
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!canSubmit}
        className="w-full rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer disabled:opacity-40 min-h-[44px]">
        {submitting ? "Creating..." : "Create Pool"}
      </button>
      <p className="font-sans text-[10px] text-[#A39E96] text-center">You can edit all settings after creating</p>
    </div>
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
