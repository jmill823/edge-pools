"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { ScoringConfig } from "@/components/ui/ScoringConfig";

interface PoolSettingsProps {
  poolId: string;
  status: string;
  name: string;
  picksDeadline: string;
  maxEntries: number;
  rules: string | null;
  // Legacy fields (kept for backwards compat)
  missedCutPenalty: string;
  scoringMode: string;
  bestX: number | null;
  bestY: number | null;
  tiebreaker: string;
  // New scoring config fields
  scoringType: string;
  missedCutPenaltyType: string;
  missedCutFixedPenalty: number | null;
  tiebreakerRule: string;
  rosterRule: string;
  rosterRuleMode: string;
  rosterRuleCount: number | null;
  categoryCount: number;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

export function PoolSettings({
  poolId,
  status,
  name,
  picksDeadline,
  maxEntries,
  rules,
  scoringType,
  missedCutPenaltyType,
  missedCutFixedPenalty,
  tiebreakerRule,
  rosterRule,
  rosterRuleMode,
  rosterRuleCount,
  categoryCount,
  onSettingsChange,
}: PoolSettingsProps) {
  const editable = status === "SETUP" || status === "OPEN";
  const scoringEditable = status === "SETUP" || status === "OPEN";

  const [formName, setFormName] = useState(name);
  const [formDeadline, setFormDeadline] = useState(
    picksDeadline ? new Date(picksDeadline).toISOString().slice(0, 16) : ""
  );
  const [formMaxEntries, setFormMaxEntries] = useState(maxEntries);
  const [formRules, setFormRules] = useState(rules || "");
  const [formScoring, setFormScoring] = useState({
    scoringType: scoringType || "to-par",
    missedCutPenaltyType: missedCutPenaltyType || "carry-score",
    missedCutFixedPenalty: missedCutFixedPenalty,
    tiebreakerRule: tiebreakerRule || "entry-timestamp",
    rosterRule: rosterRule || "all-play",
    rosterRuleMode: rosterRuleMode || "per-tournament",
    rosterRuleCount: rosterRuleCount,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          picksDeadline: new Date(formDeadline).toISOString(),
          maxEntries: formMaxEntries,
          rules: formRules.trim() || null,
          ...formScoring,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      const updated = await res.json();
      onSettingsChange(updated);
      setFeedback({ type: "success", message: "Settings saved" });
      setDirty(false);
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }, [poolId, formName, formDeadline, formMaxEntries, formRules, formScoring, onSettingsChange]);

  // Read-only labels for locked config
  const scoringTypeLabel = {
    "to-par": "To Par",
    "total-strokes": "Total Strokes",
    "points": "Points",
  }[formScoring.scoringType] ?? formScoring.scoringType;

  const mcPenaltyLabel = {
    "carry-score": "Carry score (MC score stays fixed)",
    "fixed-per-round": `+${formScoring.missedCutFixedPenalty ?? 4} per missed round`,
    "worst-make-cut": "Worst of golfers who made cut",
  }[formScoring.missedCutPenaltyType] ?? formScoring.missedCutPenaltyType;

  const tiebreakerLabel = {
    "entry-timestamp": "Earlier submission wins",
    "best-individual": "Best single golfer score",
    "none": "Ties remain tied",
  }[formScoring.tiebreakerRule] ?? formScoring.tiebreakerRule;

  const rosterRuleLabel = {
    "all-play": "All picks count",
    "best-of": `Best ${formScoring.rosterRuleCount} of ${categoryCount}`,
    "drop-worst": `Drop worst ${formScoring.rosterRuleCount}`,
  }[formScoring.rosterRule] ?? formScoring.rosterRule;

  const deadline = new Date(picksDeadline);
  const deadlineDisplay = isNaN(deadline.getTime())
    ? "—"
    : `${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${deadline.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  // Read-only view for non-editable states
  if (!editable) {
    return (
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
          Pool Settings
        </p>
        <div className="space-y-3">
          <ReadOnlyField label="Pool name" value={name} />
          <ReadOnlyField label="Picks deadline" value={deadlineDisplay} mono />
          <ReadOnlyField label="Max entries per player" value={String(maxEntries)} mono />
          {rules && <ReadOnlyField label="House rules" value={rules} />}
        </div>
        <div className="border-t border-border mt-4 pt-4">
          <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
            Scoring Configuration
          </p>
          <div className="space-y-3">
            <ReadOnlyField label="Scoring type" value={scoringTypeLabel} />
            <ReadOnlyField label="Missed-cut penalty" value={mcPenaltyLabel} />
            <ReadOnlyField label="Tiebreaker" value={tiebreakerLabel} />
            <ReadOnlyField label="Roster rule" value={rosterRuleLabel} />
          </div>
          <p className="mt-3 font-body text-xs text-text-muted">
            Scoring settings are locked once the pool is locked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
        Pool Settings
      </p>

      {feedback && (
        <div className="mb-3">
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      <div className="space-y-4">
        {/* Pool Name */}
        <div>
          <label className="block font-body text-xs font-medium text-text-secondary mb-1">
            Pool name
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => { setFormName(e.target.value); markDirty(); }}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-body text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors duration-200"
          />
        </div>

        {/* Picks Deadline */}
        <div>
          <label className="block font-body text-xs font-medium text-text-secondary mb-1">
            Picks deadline
          </label>
          <input
            type="datetime-local"
            value={formDeadline}
            onChange={(e) => { setFormDeadline(e.target.value); markDirty(); }}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-mono text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors duration-200"
          />
        </div>

        {/* Max Entries */}
        <div>
          <label className="block font-body text-xs font-medium text-text-secondary mb-1">
            Max entries per player
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setFormMaxEntries((v) => Math.max(1, v - 1)); markDirty(); }}
              disabled={formMaxEntries <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-btn border border-border bg-surface text-text-primary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="font-mono text-lg font-bold text-text-primary min-w-[2ch] text-center">
              {formMaxEntries}
            </span>
            <button
              onClick={() => { setFormMaxEntries((v) => Math.min(5, v + 1)); markDirty(); }}
              disabled={formMaxEntries >= 5}
              className="flex h-10 w-10 items-center justify-center rounded-btn border border-border bg-surface text-text-primary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* House Rules */}
        <div>
          <label className="block font-body text-xs font-medium text-text-secondary mb-1">
            House rules (optional)
          </label>
          <textarea
            value={formRules}
            onChange={(e) => { setFormRules(e.target.value); markDirty(); }}
            rows={3}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-body text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors duration-200 resize-none"
            placeholder="Payment details, tiebreaker rules, etc."
          />
        </div>

        {/* Scoring Configuration */}
        <div className="border-t border-border pt-4">
          <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
            Scoring Configuration
          </p>
          {!scoringEditable && (
            <p className="font-body text-xs text-text-muted mb-3">
              Scoring settings are locked once the pool is locked.
            </p>
          )}
          <ScoringConfig
            scoringType={formScoring.scoringType}
            missedCutPenaltyType={formScoring.missedCutPenaltyType}
            missedCutFixedPenalty={formScoring.missedCutFixedPenalty}
            tiebreakerRule={formScoring.tiebreakerRule}
            rosterRule={formScoring.rosterRule}
            rosterRuleMode={formScoring.rosterRuleMode}
            rosterRuleCount={formScoring.rosterRuleCount}
            categoryCount={categoryCount}
            onChange={(config) => { setFormScoring(config); markDirty(); }}
            disabled={!scoringEditable}
          />
        </div>

        {/* Save */}
        {dirty && (
          <Button variant="primary" loading={saving} onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        )}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-text-secondary">{label}</p>
      <p className={`mt-0.5 text-sm text-text-primary ${mono ? "font-mono" : "font-body"}`}>
        {value}
      </p>
    </div>
  );
}
