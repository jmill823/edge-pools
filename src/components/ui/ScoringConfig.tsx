"use client";

interface ScoringConfigProps {
  missedCutPenalty: string;
  scoringMode: string;
  bestX: number | null;
  bestY: number | null;
  tiebreaker: string;
  categoryCount: number;
  onChange: (config: {
    missedCutPenalty: string;
    scoringMode: string;
    bestX: number | null;
    bestY: number | null;
    tiebreaker: string;
  }) => void;
  disabled?: boolean;
}

const MISSED_CUT_OPTIONS = [
  { value: "+8", label: "+8 per missed round (default)" },
  { value: "+10", label: "+10 per missed round" },
  { value: "repeat_best", label: "Repeat best completed round score" },
  { value: "repeat_worst", label: "Repeat worst completed round score" },
  { value: "custom", label: "Custom" },
];

const SCORING_MODE_OPTIONS = [
  { value: "total", label: "Total strokes — all rounds count (default)" },
  { value: "best_x_of_y", label: "Best X of Y — pick more, count best" },
  { value: "drop_worst", label: "Drop worst — all count except worst performer" },
];

const TIEBREAKER_OPTIONS = [
  { value: "lowest_final_round", label: "Lowest final round score (default)" },
  { value: "lowest_r1", label: "Lowest Round 1 score" },
  { value: "commissioner_decides", label: "Commissioner decides manually" },
  { value: "scorecard_playoff", label: "Scorecard playoff (R4, R3, R2, R1)" },
];

export function ScoringConfig({
  missedCutPenalty,
  scoringMode,
  bestX,
  bestY,
  tiebreaker,
  categoryCount,
  onChange,
  disabled = false,
}: ScoringConfigProps) {
  const isCustomPenalty = !MISSED_CUT_OPTIONS.some(
    (o) => o.value === missedCutPenalty && o.value !== "custom"
  );
  const showCustomInput = missedCutPenalty === "custom" || isCustomPenalty;
  const customPenaltyValue = isCustomPenalty && missedCutPenalty !== "custom"
    ? missedCutPenalty
    : "";

  function handlePenaltyChange(value: string) {
    onChange({ missedCutPenalty: value, scoringMode, bestX, bestY, tiebreaker });
  }

  function handleCustomPenalty(value: string) {
    const num = value.replace(/[^0-9+-]/g, "");
    onChange({ missedCutPenalty: num || "custom", scoringMode, bestX, bestY, tiebreaker });
  }

  function handleScoringModeChange(value: string) {
    let newBestX = bestX;
    let newBestY = bestY;
    if (value === "best_x_of_y") {
      newBestX = bestX ?? Math.min(categoryCount, 6);
      newBestY = bestY ?? Math.min(categoryCount - 2, 4);
    } else {
      newBestX = null;
      newBestY = null;
    }
    onChange({ missedCutPenalty, scoringMode: value, bestX: newBestX, bestY: newBestY, tiebreaker });
  }

  function handleBestXChange(value: number) {
    const clamped = Math.max(2, Math.min(value, categoryCount));
    const y = bestY !== null && bestY < clamped ? bestY : Math.min(clamped - 1, bestY ?? clamped - 1);
    onChange({ missedCutPenalty, scoringMode, bestX: clamped, bestY: y, tiebreaker });
  }

  function handleBestYChange(value: number) {
    const x = bestX ?? categoryCount;
    const clamped = Math.max(1, Math.min(value, x - 1));
    onChange({ missedCutPenalty, scoringMode, bestX, bestY: clamped, tiebreaker });
  }

  function handleTiebreakerChange(value: string) {
    onChange({ missedCutPenalty, scoringMode, bestX, bestY, tiebreaker: value });
  }

  const selectClass = `w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-body text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 min-h-[44px] ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <div className="space-y-5">
      {/* Missed-Cut Penalty */}
      <div>
        <label className="block font-body text-xs font-medium text-text-secondary mb-1">
          Missed-Cut Penalty
        </label>
        <select
          value={showCustomInput ? "custom" : missedCutPenalty}
          onChange={(e) => handlePenaltyChange(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          {MISSED_CUT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {showCustomInput && (
          <input
            type="text"
            value={customPenaltyValue}
            onChange={(e) => handleCustomPenalty(e.target.value)}
            placeholder="e.g., +12"
            disabled={disabled}
            className={`mt-2 w-32 rounded-btn border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        )}
      </div>

      {/* Scoring Mode */}
      <div>
        <label className="block font-body text-xs font-medium text-text-secondary mb-1">
          Scoring Mode
        </label>
        <select
          value={scoringMode}
          onChange={(e) => handleScoringModeChange(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          {SCORING_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Best X of Y inputs */}
        {scoringMode === "best_x_of_y" && (
          <div className="mt-3 flex items-center gap-2 font-body text-sm text-text-primary">
            <span>Pick</span>
            <input
              type="number"
              value={bestX ?? ""}
              onChange={(e) => handleBestXChange(parseInt(e.target.value) || 2)}
              min={2}
              max={categoryCount}
              disabled={disabled}
              className={`w-16 rounded-btn border border-border bg-surface px-2 py-1.5 font-mono text-sm text-center focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <span>golfers, count best</span>
            <input
              type="number"
              value={bestY ?? ""}
              onChange={(e) => handleBestYChange(parseInt(e.target.value) || 1)}
              min={1}
              max={(bestX ?? categoryCount) - 1}
              disabled={disabled}
              className={`w-16 rounded-btn border border-border bg-surface px-2 py-1.5 font-mono text-sm text-center focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <span>scores</span>
          </div>
        )}
      </div>

      {/* Tiebreaker */}
      <div>
        <label className="block font-body text-xs font-medium text-text-secondary mb-1">
          Tiebreaker
        </label>
        <select
          value={tiebreaker}
          onChange={(e) => handleTiebreakerChange(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          {TIEBREAKER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
