"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface PoolSettingsProps {
  poolId: string;
  status: string;
  name: string;
  picksDeadline: string;
  maxEntries: number;
  rules: string | null;
  onSettingsChange: (settings: { name: string; picksDeadline: string; maxEntries: number; rules: string | null }) => void;
}

export function PoolSettings({
  poolId,
  status,
  name,
  picksDeadline,
  maxEntries,
  rules,
  onSettingsChange,
}: PoolSettingsProps) {
  const editable = status === "SETUP";

  const [formName, setFormName] = useState(name);
  const [formDeadline, setFormDeadline] = useState(
    // Convert ISO to datetime-local format for input
    picksDeadline ? new Date(picksDeadline).toISOString().slice(0, 16) : ""
  );
  const [formMaxEntries, setFormMaxEntries] = useState(maxEntries);
  const [formRules, setFormRules] = useState(rules || "");
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      const updated = await res.json();
      onSettingsChange({
        name: updated.name,
        picksDeadline: updated.picksDeadline,
        maxEntries: updated.maxEntries,
        rules: updated.rules,
      });
      setFeedback({ type: "success", message: "Settings saved" });
      setDirty(false);
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }, [poolId, formName, formDeadline, formMaxEntries, formRules, onSettingsChange]);

  const deadline = new Date(picksDeadline);
  const deadlineDisplay = isNaN(deadline.getTime())
    ? "—"
    : `${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${deadline.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  if (!editable) {
    // Read-only display
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
        <p className="mt-3 font-body text-xs text-text-muted">
          Settings are locked after pool is opened.
        </p>
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
