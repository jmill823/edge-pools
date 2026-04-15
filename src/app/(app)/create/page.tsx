"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PillSelector } from "@/components/ui/PillSelector";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface Tournament {
  id: string;
  name: string;
  course: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface TemplateCategory {
  name: string;
  qualifier?: string;
  sortOrder: number;
  golferNames: string[];
}

interface Template {
  templateName: string;
  tournamentName?: string;
  categories: TemplateCategory[];
}

interface GolferData {
  id: string;
  name: string;
}

interface CategoryData {
  name: string;
  qualifier?: string;
  sortOrder: number;
  golfers: GolferData[];
  golferNames: string[];
}

export default function CreatePoolPage() {
  const router = useRouter();
  const deadlineRef = useRef<HTMLInputElement>(null);

  // Data
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [allGolfers, setAllGolfers] = useState<GolferData[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [tournamentId, setTournamentId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [poolName, setPoolName] = useState("");
  const [picksDeadline, setPicksDeadline] = useState("");
  const [maxEntries, setMaxEntries] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState("");

  // Scoring pills
  const [scoringType, setScoringType] = useState("to-par");
  const [customScoringType, setCustomScoringType] = useState("");
  const [mcPenalty, setMcPenalty] = useState("+10");
  const [customMcPenalty, setCustomMcPenalty] = useState("");
  const [tiebreaker, setTiebreaker] = useState("earliest-entry");
  const [customTiebreaker, setCustomTiebreaker] = useState("");
  const [winnerRule, setWinnerRule] = useState("all-picks");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch("/api/tournaments").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/golfers").then((r) => r.json()),
    ])
      .then(([t, tmpl, g]) => {
        // Filter out Valero Texas Open from the selector (per QA-027a)
        const tournamentList = (t as Tournament[]).filter(
          (x) => !x.name.toLowerCase().includes("valero")
        );
        setTournaments(tournamentList);
        setAllTemplates(tmpl);
        setAllGolfers(g);

        // Auto-select if only one UPCOMING
        const upcoming = tournamentList.filter((x) => x.status === "UPCOMING");
        if (upcoming.length === 1) {
          setTournamentId(upcoming[0].id);
          setPicksDeadline(toDateTimeLocal(upcoming[0].startDate));
          setPoolName(`${upcoming[0].name} Pool`);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter templates by selected tournament
  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const filteredTemplates = selectedTournament
    ? allTemplates.filter((t) => {
        const tn = t.tournamentName?.toLowerCase() || "";
        const sn = selectedTournament.name.toLowerCase();
        return tn.includes(sn) || sn.includes(tn) || !t.tournamentName;
      })
    : allTemplates;

  // Auto-select first template when tournament changes
  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.find((t) => t.templateName === selectedTemplate)) {
      handleTemplateSelect(filteredTemplates[0].templateName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

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
    const tmpl = allTemplates.find((t) => t.templateName === templateName);
    if (!tmpl) return;
    const golferMap = new Map(allGolfers.map((g) => [g.name, g]));
    setCategories(
      tmpl.categories.map((c) => ({
        name: c.name,
        qualifier: c.qualifier,
        sortOrder: c.sortOrder,
        golferNames: c.golferNames,
        golfers: c.golferNames
          .map((n) => golferMap.get(n))
          .filter((g): g is GolferData => !!g),
      }))
    );
  }

  // Map pill values to API fields
  function getScoringPayload() {
    const payload: Record<string, unknown> = {};

    // Scoring type
    if (scoringType === "custom") {
      payload.scoringType = "custom";
      payload.scoringCustomText = customScoringType || null;
    } else {
      payload.scoringType = scoringType === "stroke" ? "total-strokes" : "to-par";
    }

    // MC penalty
    if (mcPenalty === "custom") {
      payload.missedCutPenaltyType = "custom";
      payload.missedCutCustomText = customMcPenalty || null;
    } else if (mcPenalty === "none") {
      payload.missedCutPenaltyType = "carry-score";
    } else {
      payload.missedCutPenaltyType = "fixed-per-round";
      payload.missedCutFixedPenalty = parseInt(mcPenalty.replace("+", ""), 10);
    }

    // Tiebreaker
    if (tiebreaker === "custom") {
      payload.tiebreakerRule = "custom";
      payload.tiebreakerCustomText = customTiebreaker || null;
    } else if (tiebreaker === "best-score") {
      payload.tiebreakerRule = "best-individual";
    } else {
      payload.tiebreakerRule = "entry-timestamp";
    }

    // Winner rule
    if (winnerRule === "best-6-of-9") {
      payload.rosterRule = "best-of";
      payload.rosterRuleCount = 6;
    } else if (winnerRule === "best-4-of-6") {
      payload.rosterRule = "best-of";
      payload.rosterRuleCount = 4;
    } else {
      payload.rosterRule = "all-play";
    }

    return payload;
  }

  async function handleSubmit() {
    if (!tournamentId || !poolName.trim() || categories.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const scoringPayload = getScoringPayload();

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
          ...scoringPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to create pool" }));
        setError(data.error || "Failed to create pool");
        setSubmitting(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/pool/${id}/manage`);
    } catch {
      setError("Failed to create pool. Check your connection.");
      setSubmitting(false);
    }
  }

  if (loading) return null;

  const upcoming = tournaments.filter((t) => t.status === "UPCOMING");
  const nonUpcoming = tournaments.filter((t) => t.status !== "UPCOMING");
  const canSubmit = !!tournamentId && !!poolName.trim() && categories.length > 0 && !submitting;

  // Unique golfer count for template card
  function uniqueGolferCount(tmpl: Template): number {
    const names = new Set<string>();
    tmpl.categories.forEach((c) => c.golferNames.forEach((n) => names.add(n)));
    return names.size;
  }

  // Deadline display
  const deadlineDate = picksDeadline ? new Date(picksDeadline) : null;
  const deadlineDisplay = deadlineDate && !isNaN(deadlineDate.getTime())
    ? deadlineDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
      " · " +
      deadlineDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "Select a date";

  return (
    <div className="mx-auto max-w-content px-4 pt-6 pb-24 space-y-6" style={{ background: "#FAFAFA" }}>
      {/* Heading */}
      <h1 className="font-sans text-[18px] font-semibold text-[#1A1A18]">
        Create a pool
      </h1>

      {/* ── TOURNAMENT ── */}
      <section>
        <SectionLabel className="mb-2">TOURNAMENT</SectionLabel>
        {upcoming.length === 0 && nonUpcoming.length === 0 ? (
          <div className="bg-white border-[0.5px] border-[#E2DDD5] rounded-[8px] p-4 text-center">
            <p className="font-sans text-[13px] text-[#A39E96]">No upcoming tournaments scheduled</p>
            <p className="font-sans text-[11px] text-[#A39E96] mt-1">Check back when the next PGA event is announced.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {upcoming.map((t) => (
              <TournamentCard key={t.id} tournament={t} selected={tournamentId === t.id} onSelect={handleTournamentSelect} />
            ))}
            {nonUpcoming.map((t) => (
              <TournamentCard key={t.id} tournament={t} selected={false} onSelect={() => {}} disabled />
            ))}
          </div>
        )}
      </section>

      {/* ── TEMPLATE ── */}
      <section>
        <SectionLabel className="mb-2">TEMPLATE</SectionLabel>
        {filteredTemplates.length === 0 ? (
          <p className="font-sans text-[13px] text-[#A39E96] text-center py-4">
            No templates available for this tournament
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.templateName;
              return (
                <button
                  key={tmpl.templateName}
                  onClick={() => handleTemplateSelect(tmpl.templateName)}
                  className={`text-left bg-white rounded-[8px] p-3 transition-all duration-200 cursor-pointer ${
                    isSelected ? "border-2 border-[#B09A60]" : "border-[0.5px] border-[#E2DDD5] hover:border-[#B09A60]/40"
                  }`}
                >
                  <p className="font-sans text-[13px] font-semibold text-[#1A1A18] truncate">
                    {tmpl.templateName}
                  </p>
                  <p className="font-sans text-[11px] text-[#6B6560] mt-0.5">
                    {tmpl.categories.length} cat · {uniqueGolferCount(tmpl)} golfers
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CATEGORY PREVIEW ── */}
      {categories.length > 0 && (
        <section>
          <SectionLabel className="mb-2">CATEGORIES</SectionLabel>
          <div className="border-[0.5px] border-[#E2DDD5] rounded-[8px] overflow-hidden">
            {categories.map((cat, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedCat(expandedCat === i ? null : i)}
                  className="flex items-center justify-between w-full px-3 h-[44px] border-b-[0.5px] border-[#E2DDD5] last:border-b-0 bg-white cursor-pointer hover:bg-[#FAFAFA] transition-colors duration-200"
                >
                  <span className="font-sans text-[13px] font-medium text-[#1A1A18] truncate">
                    {cat.name}
                  </span>
                  <span className="font-mono text-[12px] text-[#6B6560] shrink-0 ml-2">
                    {cat.golferNames.length} golfers
                  </span>
                </button>
                {expandedCat === i && (
                  <div className="px-3 py-2 bg-[#FAFAFA] border-b-[0.5px] border-[#E2DDD5]">
                    <p className="font-sans text-[12px] text-[#6B6560] leading-relaxed">
                      {cat.golferNames.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── POOL NAME ── */}
      <section>
        <SectionLabel className="mb-2">POOL NAME</SectionLabel>
        <input
          type="text"
          value={poolName}
          onChange={(e) => setPoolName(e.target.value)}
          placeholder="e.g. Heritage Pool 2026"
          className="w-full bg-white rounded-[8px] border-[0.5px] border-[#E2DDD5] px-4 py-3 font-sans text-[14px] text-[#1A1A18] placeholder:text-[#A39E96] focus:border-[#B09A60] focus:outline-none focus:ring-2 focus:ring-[#B09A60]/15 min-h-[44px]"
        />
      </section>

      {/* ── PICKS DEADLINE ── */}
      <section>
        <SectionLabel className="mb-2">PICKS DEADLINE</SectionLabel>
        <button
          onClick={() => deadlineRef.current?.showPicker()}
          className="w-full text-left bg-white rounded-[8px] border-[0.5px] border-[#E2DDD5] px-4 py-3 font-sans text-[14px] font-medium text-[#1A1A18] cursor-pointer hover:border-[#B09A60]/40 transition-colors duration-200 min-h-[44px] relative"
        >
          {deadlineDisplay}
          <input
            ref={deadlineRef}
            type="datetime-local"
            value={picksDeadline}
            onChange={(e) => setPicksDeadline(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            tabIndex={-1}
          />
        </button>
      </section>

      {/* ── MAX ENTRIES ── */}
      <section>
        <SectionLabel className="mb-2">MAX ENTRIES PER PLAYER</SectionLabel>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMaxEntries((v) => Math.max(1, v - 1))}
            disabled={maxEntries <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white border-[0.5px] border-[#E2DDD5] font-sans text-[18px] text-[#1A1A18] cursor-pointer hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] min-w-[44px]"
          >
            −
          </button>
          <span className="font-mono text-[18px] font-semibold text-[#1A1A18] w-12 text-center">
            {maxEntries}
          </span>
          <button
            type="button"
            onClick={() => setMaxEntries((v) => Math.min(10, v + 1))}
            disabled={maxEntries >= 10}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white border-[0.5px] border-[#E2DDD5] font-sans text-[18px] text-[#1A1A18] cursor-pointer hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] min-w-[44px]"
          >
            +
          </button>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t-[0.5px] border-[#E2DDD5]" />

      {/* ── SCORING ── */}
      <section className="space-y-4">
        <SectionLabel>SCORING</SectionLabel>

        {/* 8A: Scoring Type */}
        <div>
          <p className="font-sans text-[12px] font-medium text-[#1A1A18] mb-2">Scoring type</p>
          <PillSelector
            options={[
              { label: "To par", value: "to-par" },
              { label: "Stroke", value: "stroke" },
              { label: "Custom", value: "custom", isCustom: true },
            ]}
            selected={scoringType}
            onSelect={(v) => { setScoringType(v); if (v !== "custom") setCustomScoringType(""); }}
            customValue={customScoringType}
            onCustomChange={setCustomScoringType}
            customPlaceholder="e.g. Modified Stableford"
          />
        </div>

        {/* 8B: Missed Cut Penalty */}
        <div>
          <p className="font-sans text-[12px] font-medium text-[#1A1A18] mb-2">Missed cut penalty</p>
          <PillSelector
            options={[
              { label: "+10", value: "+10" },
              { label: "+8", value: "+8" },
              { label: "+12", value: "+12" },
              { label: "None", value: "none" },
              { label: "Custom", value: "custom", isCustom: true },
            ]}
            selected={mcPenalty}
            onSelect={(v) => { setMcPenalty(v); if (v !== "custom") setCustomMcPenalty(""); }}
            customValue={customMcPenalty}
            onCustomChange={setCustomMcPenalty}
            customPlaceholder="e.g. +8 per missed round, cap at 2"
          />
        </div>

        {/* 8C: Tiebreaker */}
        <div>
          <p className="font-sans text-[12px] font-medium text-[#1A1A18] mb-2">Tiebreaker</p>
          <PillSelector
            options={[
              { label: "Earliest entry", value: "earliest-entry" },
              { label: "Best score", value: "best-score" },
              { label: "Custom", value: "custom", isCustom: true },
            ]}
            selected={tiebreaker}
            onSelect={(v) => { setTiebreaker(v); if (v !== "custom") setCustomTiebreaker(""); }}
            customValue={customTiebreaker}
            onCustomChange={setCustomTiebreaker}
            customPlaceholder="e.g. Scorecard playoff starting at 18"
          />
        </div>

        {/* 8D: Winner Rule — NO Custom option */}
        <div>
          <p className="font-sans text-[12px] font-medium text-[#1A1A18] mb-2">Winner rule</p>
          <PillSelector
            options={[
              { label: "All picks", value: "all-picks" },
              { label: "Best 6 of 9", value: "best-6-of-9" },
              { label: "Best 4 of 6", value: "best-4-of-6" },
            ]}
            selected={winnerRule}
            onSelect={setWinnerRule}
          />
        </div>
      </section>

      {/* ── HOUSE RULES ── */}
      <section>
        {!showRules ? (
          <button
            onClick={() => setShowRules(true)}
            className="font-sans text-[12px] font-medium text-[#B09A60] cursor-pointer hover:underline"
          >
            + Add house rules
          </button>
        ) : (
          <>
            <SectionLabel className="mb-2">HOUSE RULES</SectionLabel>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. $20 per entry, Venmo to @mike. Winner takes 70%, runner-up 30%."
              maxLength={500}
              className="w-full bg-white rounded-[8px] border-[0.5px] border-[#E2DDD5] px-4 py-3 font-sans text-[13px] text-[#1A1A18] placeholder:text-[#A39E96] focus:border-[#B09A60] focus:outline-none focus:ring-2 focus:ring-[#B09A60]/15 min-h-[80px] resize-y"
            />
          </>
        )}
      </section>

      {/* ── ERROR ── */}
      {error && (
        <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
      )}

      {/* ── CREATE BUTTON ── */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full rounded-[8px] font-sans text-[15px] font-semibold py-[14px] min-h-[48px] transition-all duration-200 ${
          canSubmit
            ? "text-white cursor-pointer"
            : "bg-[#A39E96] text-white cursor-not-allowed"
        }`}
        style={canSubmit ? { background: "linear-gradient(135deg, #B09A60, #9E8A52)" } : undefined}
      >
        {submitting ? "Creating..." : "Create pool"}
      </button>
      <p className="font-sans text-[11px] text-[#A39E96] text-center">
        You can edit settings after creating
      </p>
    </div>
  );
}

/* ── Tournament Card ── */

function TournamentCard({
  tournament,
  selected,
  onSelect,
  disabled,
}: {
  tournament: Tournament;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const dateStr = `${fmtDate(tournament.startDate)}–${new Date(tournament.endDate).getDate()}`;
  const detail = tournament.course ? `${dateStr} · ${tournament.course}` : dateStr;

  return (
    <button
      onClick={() => !disabled && onSelect(tournament.id)}
      disabled={disabled}
      className={`text-left bg-white rounded-[8px] p-3 transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        selected
          ? "border-2 border-[#B09A60]"
          : "border-[0.5px] border-[#E2DDD5] hover:border-[#B09A60]/40"
      }`}
    >
      <p className="font-sans text-[13px] font-semibold text-[#1A1A18] truncate">{tournament.name}</p>
      <p className="font-sans text-[11px] text-[#6B6560] mt-0.5 truncate">{detail}</p>
      {disabled && tournament.status === "COMPLETE" && (
        <span className="inline-block mt-1 font-sans text-[9px] text-[#A39E96] bg-[#F5F1EB] rounded-[4px] px-1.5 py-0.5">
          Completed
        </span>
      )}
    </button>
  );
}

/* ── Helpers ── */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
