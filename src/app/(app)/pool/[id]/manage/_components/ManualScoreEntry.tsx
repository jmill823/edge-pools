"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface GolferWithScore {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
  currentScore: {
    totalScore: number | null;
    position: string | null;
    round: number;
  } | null;
}

interface ManualScoreEntryProps {
  tournamentId: string;
  onClose: () => void;
  onScoresUpdated: () => void;
}

export function ManualScoreEntry({ tournamentId, onClose, onScoresUpdated }: ManualScoreEntryProps) {
  const [golfers, setGolfers] = useState<GolferWithScore[]>([]);
  const [scores, setScores] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGolfers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/scores/${tournamentId}`);
      if (!res.ok) throw new Error("Failed to load golfers");
      const data = await res.json();
      setGolfers(data.golfers || []);

      // Pre-fill scores
      const initial = new Map<string, string>();
      for (const g of data.golfers || []) {
        if (g.currentScore?.totalScore !== null && g.currentScore?.totalScore !== undefined) {
          initial.set(g.id, String(g.currentScore.totalScore));
        }
      }
      setScores(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load golfers");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchGolfers();
  }, [fetchGolfers]);

  const handleScoreChange = (golferId: string, value: string) => {
    setScores((prev) => {
      const next = new Map(prev);
      if (value === "" || value === "-") {
        next.set(golferId, value);
      } else {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          next.set(golferId, String(num));
        }
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFeedback(null);

    // Build updates — only golfers whose scores were changed
    const updates: Array<{ golferId: string; round: number; totalScore: number }> = [];
    for (const golfer of golfers) {
      const newVal = scores.get(golfer.id);
      if (newVal === undefined || newVal === "" || newVal === "-") continue;

      const newScore = parseInt(newVal, 10);
      if (isNaN(newScore)) continue;

      const existingScore = golfer.currentScore?.totalScore;
      if (existingScore !== null && existingScore !== undefined && existingScore === newScore) continue;

      updates.push({
        golferId: golfer.id,
        round: golfer.currentScore?.round || 1,
        totalScore: newScore,
      });
    }

    if (updates.length === 0) {
      setFeedback({ type: "error", message: "No scores were changed" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/scores/${tournamentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: updates }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update scores");
      }

      const data = await res.json();
      setFeedback({ type: "success", message: `${data.updated} score${data.updated !== 1 ? "s" : ""} updated` });
      onScoresUpdated();

      // Refresh golfer scores
      await fetchGolfers();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update scores" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="font-sans text-sm text-text-muted">Loading golfers...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="font-sans text-sm text-accent-danger">{error}</p>
        <button onClick={onClose} className="mt-2 font-sans text-sm text-accent-primary hover:underline cursor-pointer">
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-sm font-medium text-text-primary">
          Manual Score Entry ({golfers.length} golfer{golfers.length !== 1 ? "s" : ""})
        </p>
        <button
          onClick={onClose}
          className="font-sans text-xs text-text-muted hover:text-text-primary cursor-pointer"
        >
          Close
        </button>
      </div>

      {feedback && (
        <div className="mb-3">
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto border border-border rounded-data">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-alt">
            <tr>
              <th className="text-left px-2 py-1.5 font-sans text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">
                Golfer
              </th>
              <th className="text-right px-2 py-1.5 font-sans text-[9px] font-medium text-text-muted uppercase tracking-[0.5px] w-[60px]">
                Current
              </th>
              <th className="text-right px-2 py-1.5 font-sans text-[9px] font-medium text-text-muted uppercase tracking-[0.5px] w-[70px]">
                New Score
              </th>
            </tr>
          </thead>
          <tbody>
            {golfers.map((golfer) => {
              const currentTotal = golfer.currentScore?.totalScore;
              const inputVal = scores.get(golfer.id) ?? "";
              const isChanged = inputVal !== "" && inputVal !== "-" && parseInt(inputVal, 10) !== currentTotal;

              return (
                <tr
                  key={golfer.id}
                  className={`border-t border-border/50 ${isChanged ? "bg-[#FDF4E3]" : ""}`}
                >
                  <td className="px-2 py-1.5">
                    <span className="font-sans text-xs font-medium text-text-primary">{golfer.name}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className={`font-mono text-xs ${
                      currentTotal === null || currentTotal === undefined
                        ? "text-text-muted"
                        : currentTotal < 0
                        ? "text-accent-success"
                        : currentTotal > 0
                        ? "text-accent-danger"
                        : "text-text-secondary"
                    }`}>
                      {currentTotal === null || currentTotal === undefined
                        ? "\u2014"
                        : currentTotal === 0
                        ? "E"
                        : currentTotal > 0
                        ? `+${currentTotal}`
                        : currentTotal}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputVal}
                      onChange={(e) => handleScoreChange(golfer.id, e.target.value)}
                      placeholder="\u2014"
                      className="w-full text-right rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/15"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <Button
          variant="primary"
          loading={saving}
          onClick={handleSubmit}
          className="w-full"
        >
          Update All
        </Button>
      </div>
    </div>
  );
}
