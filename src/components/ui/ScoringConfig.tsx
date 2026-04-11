"use client";

interface ScoringConfigProps {
  scoringType: string;
  missedCutPenaltyType: string;
  missedCutFixedPenalty: number | null;
  tiebreakerRule: string;
  rosterRule: string;
  rosterRuleMode: string;
  rosterRuleCount: number | null;
  categoryCount: number;
  onChange: (config: {
    scoringType: string;
    missedCutPenaltyType: string;
    missedCutFixedPenalty: number | null;
    tiebreakerRule: string;
    rosterRule: string;
    rosterRuleMode: string;
    rosterRuleCount: number | null;
  }) => void;
  disabled?: boolean;
}

const SCORING_TYPE_OPTIONS = [
  { value: "to-par", label: "To Par (default)" },
  { value: "total-strokes", label: "Total Strokes" },
  { value: "points", label: "Points (Coming soon)", disabled: true },
];

const MISSED_CUT_OPTIONS = [
  { value: "carry-score", label: "Carry score — MC score stays fixed" },
  { value: "fixed-per-round", label: "Fixed penalty per missed round" },
  { value: "worst-make-cut", label: "Worst of golfers who made cut" },
];

const TIEBREAKER_OPTIONS = [
  { value: "entry-timestamp", label: "Earlier submission wins (default)" },
  { value: "best-individual", label: "Best single golfer score" },
  { value: "none", label: "Ties remain tied" },
];

const ROSTER_RULE_OPTIONS = [
  { value: "all-play", label: "All picks count (default)" },
  { value: "best-of", label: "Best X of Y — count best scores" },
  { value: "drop-worst", label: "Drop worst — exclude worst scores" },
];

const ROSTER_RULE_MODE_OPTIONS = [
  { value: "per-tournament", label: "Per tournament" },
  { value: "per-round", label: "Per round" },
];

export function ScoringConfig({
  scoringType,
  missedCutPenaltyType,
  missedCutFixedPenalty,
  tiebreakerRule,
  rosterRule,
  rosterRuleMode,
  rosterRuleCount,
  categoryCount,
  onChange,
  disabled = false,
}: ScoringConfigProps) {
  const current = {
    scoringType,
    missedCutPenaltyType,
    missedCutFixedPenalty,
    tiebreakerRule,
    rosterRule,
    rosterRuleMode,
    rosterRuleCount,
  };

  function update(partial: Partial<typeof current>) {
    onChange({ ...current, ...partial });
  }

  const selectClass = `w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 min-h-[44px] ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  }`;

  const showRosterDetails = rosterRule === "best-of" || rosterRule === "drop-worst";

  return (
    <div className="space-y-5">
      {/* Scoring Type */}
      <div>
        <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
          Scoring Type
        </label>
        <select
          value={scoringType}
          onChange={(e) => update({ scoringType: e.target.value })}
          disabled={disabled}
          className={selectClass}
        >
          {SCORING_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Missed-Cut Penalty */}
      <div>
        <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
          Missed-Cut Penalty
        </label>
        <select
          value={missedCutPenaltyType}
          onChange={(e) => update({ missedCutPenaltyType: e.target.value })}
          disabled={disabled}
          className={selectClass}
        >
          {MISSED_CUT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {missedCutPenaltyType === "fixed-per-round" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-sans text-sm text-text-secondary">+</span>
            <input
              type="number"
              value={missedCutFixedPenalty ?? 4}
              onChange={(e) =>
                update({
                  missedCutFixedPenalty: parseInt(e.target.value) || 4,
                })
              }
              min={1}
              max={20}
              disabled={disabled}
              className={`w-16 rounded-btn border border-border bg-surface px-2 py-1.5 font-mono text-sm text-center focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <span className="font-sans text-sm text-text-secondary">per missed round</span>
          </div>
        )}
      </div>

      {/* Tiebreaker */}
      <div>
        <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
          Tiebreaker
        </label>
        <select
          value={tiebreakerRule}
          onChange={(e) => update({ tiebreakerRule: e.target.value })}
          disabled={disabled}
          className={selectClass}
        >
          {TIEBREAKER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Roster Rule */}
      <div>
        <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
          Roster Rule
        </label>
        <select
          value={rosterRule}
          onChange={(e) => {
            const val = e.target.value;
            const defaults: Partial<typeof current> = { rosterRule: val };
            if (val === "all-play") {
              defaults.rosterRuleCount = null;
              defaults.rosterRuleMode = "per-tournament";
            } else if (val === "best-of") {
              defaults.rosterRuleCount = rosterRuleCount ?? Math.max(1, categoryCount - 2);
              defaults.rosterRuleMode = rosterRuleMode || "per-tournament";
            } else if (val === "drop-worst") {
              defaults.rosterRuleCount = rosterRuleCount ?? 1;
              defaults.rosterRuleMode = rosterRuleMode || "per-tournament";
            }
            update(defaults);
          }}
          disabled={disabled}
          className={selectClass}
        >
          {ROSTER_RULE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {showRosterDetails && (
          <div className="mt-3 space-y-3">
            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <label className="font-sans text-xs text-text-secondary">Mode:</label>
              <select
                value={rosterRuleMode}
                onChange={(e) => update({ rosterRuleMode: e.target.value })}
                disabled={disabled}
                className={`rounded-btn border border-border bg-surface px-2 py-1.5 font-sans text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {ROSTER_RULE_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Count input */}
            <div className="flex items-center gap-2 font-sans text-sm text-text-primary">
              <span>{rosterRule === "best-of" ? "Keep best" : "Drop worst"}</span>
              <input
                type="number"
                value={rosterRuleCount ?? 1}
                onChange={(e) =>
                  update({
                    rosterRuleCount: Math.max(
                      1,
                      Math.min(parseInt(e.target.value) || 1, categoryCount - 1)
                    ),
                  })
                }
                min={1}
                max={categoryCount - 1}
                disabled={disabled}
                className={`w-16 rounded-btn border border-border bg-surface px-2 py-1.5 font-mono text-sm text-center focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <span>
                {rosterRule === "best-of"
                  ? `of ${categoryCount} picks`
                  : `of ${categoryCount} scores`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
