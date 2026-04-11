"use client";

import { useState, useCallback } from "react";
import { holeScoreColor } from "./score-utils";

interface HoleData {
  hole: number;
  score: number;
  par: number;
}

interface GolferScorecard {
  golferName: string;
  roundComplete: boolean;
  currentHole: number;
  currentRoundScore: string;
  totalShots: number;
  holes: HoleData[];
}

interface HoleByHoleCardProps {
  poolId: string;
  golferIds: string[];
  golferNames: string[];
  currentRound: number | null;
}

export function HoleByHoleCard({ poolId, golferIds, golferNames, currentRound }: HoleByHoleCardProps) {
  const [scorecards, setScorecards] = useState<Record<string, GolferScorecard | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(currentRound ?? 1);

  const fetchScorecards = useCallback(async (fetchRound: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pools/${poolId}/scorecard?golferIds=${golferIds.join(",")}&round=${fetchRound}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load scorecards");
      }
      const data = await res.json();
      setScorecards(data.scorecards);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [poolId, golferIds]);

  const handleLoad = useCallback(() => {
    fetchScorecards(round);
  }, [fetchScorecards, round]);

  const handleRoundChange = useCallback((newRound: number) => {
    setRound(newRound);
    fetchScorecards(newRound);
  }, [fetchScorecards]);

  // Initial state: show load button
  if (!scorecards && !loading && !error) {
    return (
      <div className="pt-2 pb-1">
        <button
          onClick={handleLoad}
          className="font-sans text-xs text-accent-primary hover:underline cursor-pointer"
        >
          View hole-by-hole &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">
          Hole-by-Hole
        </span>
        {/* Round selector */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((r) => (
            <button
              key={r}
              onClick={() => handleRoundChange(r)}
              disabled={loading}
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                round === r
                  ? "bg-accent-primary text-white font-bold"
                  : "text-text-muted hover:bg-surface-alt"
              }`}
            >
              R{r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="h-3 w-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-sans text-xs text-text-muted">Loading scorecards…</span>
        </div>
      )}

      {error && (
        <div className="py-2">
          <p className="font-sans text-xs text-accent-danger">{error}</p>
          <button
            onClick={handleLoad}
            className="mt-1 font-sans text-xs text-accent-primary hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {scorecards && !loading && (
        <div className="space-y-3">
          {golferIds.map((id, idx) => {
            const card = scorecards[id];
            if (!card) {
              return (
                <div key={id} className="text-xs font-sans text-text-muted">
                  {golferNames[idx]}: No scorecard available
                </div>
              );
            }
            return (
              <GolferScorecardRow
                key={id}
                golferName={card.golferName || golferNames[idx]}
                holes={card.holes}
                roundComplete={card.roundComplete}
                currentHole={card.currentHole}
                currentRoundScore={card.currentRoundScore}
                totalShots={card.totalShots}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Individual golfer scorecard row ──

function GolferScorecardRow({
  golferName,
  holes,
  roundComplete,
  currentHole,
  currentRoundScore,
  totalShots,
}: {
  golferName: string;
  holes: HoleData[];
  roundComplete: boolean;
  currentHole: number;
  currentRoundScore: string;
  totalShots: number;
}) {
  const front9 = holes.filter((h) => h.hole <= 9);
  const back9 = holes.filter((h) => h.hole > 9);

  const outScore = front9.reduce((sum, h) => sum + h.score, 0);
  const outPar = front9.reduce((sum, h) => sum + h.par, 0);
  const inScore = back9.reduce((sum, h) => sum + h.score, 0);
  const inPar = back9.reduce((sum, h) => sum + h.par, 0);

  return (
    <div>
      {/* Golfer name + round score */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-xs font-medium text-text-primary truncate">
          {golferName}
        </span>
        <span className="font-mono text-xs font-bold text-text-secondary shrink-0 ml-2">
          {totalShots} ({currentRoundScore})
          {!roundComplete && <span className="text-text-muted font-normal"> · thru {currentHole}</span>}
        </span>
      </div>

      {/* Front 9 */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr>
              {front9.map((h) => (
                <th key={h.hole} className="font-mono text-[9px] text-text-muted font-normal text-center w-[28px] pb-0.5">
                  {h.hole}
                </th>
              ))}
              <th className="font-mono text-[9px] text-text-muted font-medium text-center w-[32px] pb-0.5 border-l border-border">
                OUT
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Par row */}
            <tr>
              {front9.map((h) => (
                <td key={h.hole} className="font-mono text-[10px] text-text-muted text-center py-0.5">
                  {h.par}
                </td>
              ))}
              <td className="font-mono text-[10px] text-text-muted text-center py-0.5 border-l border-border font-medium">
                {outPar}
              </td>
            </tr>
            {/* Score row */}
            <tr>
              {front9.map((h) => (
                <td key={h.hole} className="text-center py-0.5">
                  <span className={`inline-block w-[22px] font-mono text-[11px] font-bold rounded-sm ${
                    h.hole <= (roundComplete ? 18 : currentHole)
                      ? holeScoreColor(h.score, h.par)
                      : "text-text-muted"
                  }`}>
                    {h.hole <= (roundComplete ? 18 : currentHole) ? h.score : "·"}
                  </span>
                </td>
              ))}
              <td className="text-center py-0.5 border-l border-border">
                <span className={`font-mono text-[11px] font-bold ${
                  outScore < outPar ? "text-accent-success" : outScore > outPar ? "text-accent-danger" : "text-text-secondary"
                }`}>
                  {front9.some((h) => h.hole <= (roundComplete ? 18 : currentHole)) ? outScore : "·"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Back 9 */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch mt-0.5">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr>
              {back9.map((h) => (
                <th key={h.hole} className="font-mono text-[9px] text-text-muted font-normal text-center w-[28px] pb-0.5">
                  {h.hole}
                </th>
              ))}
              <th className="font-mono text-[9px] text-text-muted font-medium text-center w-[32px] pb-0.5 border-l border-border">
                IN
              </th>
              <th className="font-mono text-[9px] text-text-muted font-medium text-center w-[32px] pb-0.5 border-l border-border">
                TOT
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Par row */}
            <tr>
              {back9.map((h) => (
                <td key={h.hole} className="font-mono text-[10px] text-text-muted text-center py-0.5">
                  {h.par}
                </td>
              ))}
              <td className="font-mono text-[10px] text-text-muted text-center py-0.5 border-l border-border font-medium">
                {inPar}
              </td>
              <td className="font-mono text-[10px] text-text-muted text-center py-0.5 border-l border-border font-medium">
                {outPar + inPar}
              </td>
            </tr>
            {/* Score row */}
            <tr>
              {back9.map((h) => (
                <td key={h.hole} className="text-center py-0.5">
                  <span className={`inline-block w-[22px] font-mono text-[11px] font-bold rounded-sm ${
                    h.hole <= (roundComplete ? 18 : currentHole)
                      ? holeScoreColor(h.score, h.par)
                      : "text-text-muted"
                  }`}>
                    {h.hole <= (roundComplete ? 18 : currentHole) ? h.score : "·"}
                  </span>
                </td>
              ))}
              <td className="text-center py-0.5 border-l border-border">
                <span className={`font-mono text-[11px] font-bold ${
                  inScore < inPar ? "text-accent-success" : inScore > inPar ? "text-accent-danger" : "text-text-secondary"
                }`}>
                  {back9.some((h) => h.hole <= (roundComplete ? 18 : currentHole)) ? inScore : "·"}
                </span>
              </td>
              <td className="text-center py-0.5 border-l border-border">
                <span className={`font-mono text-[11px] font-bold ${
                  totalShots < outPar + inPar ? "text-accent-success" : totalShots > outPar + inPar ? "text-accent-danger" : "text-text-secondary"
                }`}>
                  {roundComplete || currentHole > 0 ? totalShots : "·"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
