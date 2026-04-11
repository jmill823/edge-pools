"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface Replacement {
  id: string;
  pickId: string;
  originalGolferId: string;
  replacementGolferId: string;
  reason: string;
  status: string;
  originalGolferName: string;
  replacementGolferName: string;
  replacementScore: number | null;
  playerName: string;
  entryNumber: number;
  categoryName: string;
}

interface EligibleGolfer {
  id: string;
  name: string;
  score: number | null;
}

interface ReplacementQueueProps {
  poolId: string;
  pendingCount: number;
  onReplacementProcessed: () => void;
}

export function ReplacementQueue({ poolId, pendingCount, onReplacementProcessed }: ReplacementQueueProps) {
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [eligibleGolfers, setEligibleGolfers] = useState<EligibleGolfer[]>([]);
  const [selectedOverride, setSelectedOverride] = useState<string>("");

  const fetchReplacements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/replacements/${poolId}`);
      if (!res.ok) throw new Error("Failed to fetch replacements");
      const data = await res.json();
      setReplacements(data.filter((r: Replacement) => r.status === "PENDING"));
    } catch {
      setFeedback({ type: "error", message: "Failed to load replacements" });
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    if (expanded && pendingCount > 0) {
      fetchReplacements();
    }
  }, [expanded, pendingCount, fetchReplacements]);

  const handleConfirm = async (replacement: Replacement) => {
    if (!replacement.replacementGolferId) {
      setFeedback({ type: "error", message: "No replacement golfer available — use Override to select one" });
      return;
    }
    setProcessingId(replacement.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/replacements/${poolId}/${replacement.id}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Confirm failed");
      }
      setReplacements((prev) => prev.filter((r) => r.id !== replacement.id));
      onReplacementProcessed();
      setFeedback({ type: "success", message: `Replaced ${replacement.originalGolferName} with ${replacement.replacementGolferName}` });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Confirm failed" });
    } finally {
      setProcessingId(null);
    }
  };

  const startOverride = async (replacement: Replacement) => {
    setOverrideId(replacement.id);
    setSelectedOverride("");
    setEligibleGolfers([]);
    try {
      const res = await fetch(`/api/admin/replacements/${poolId}/${replacement.id}/eligible`);
      if (!res.ok) throw new Error("Failed to fetch eligible golfers");
      const data = await res.json();
      setEligibleGolfers(data);
    } catch {
      setFeedback({ type: "error", message: "Failed to load eligible golfers" });
    }
  };

  const handleOverride = async (replacement: Replacement) => {
    if (!selectedOverride) {
      setFeedback({ type: "error", message: "Select a replacement golfer" });
      return;
    }
    setProcessingId(replacement.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/replacements/${poolId}/${replacement.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replacementGolferId: selectedOverride }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Override failed");
      }
      setReplacements((prev) => prev.filter((r) => r.id !== replacement.id));
      setOverrideId(null);
      onReplacementProcessed();
      setFeedback({ type: "success", message: "Replacement overridden successfully" });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Override failed" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <p className="font-sans text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-2">
        WD/CUT Replacements
      </p>

      {pendingCount > 0 && (
        <div className="mb-2 rounded-data bg-[#FDF4E3] px-3 py-2 flex items-center justify-between">
          <p className="font-sans text-sm font-medium text-[#8A6B1E]">
            {pendingCount} replacement{pendingCount !== 1 ? "s" : ""} need confirmation
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-sans text-xs font-medium text-accent-primary hover:underline cursor-pointer"
          >
            {expanded ? "Hide" : "Review"}
          </button>
        </div>
      )}

      {pendingCount === 0 && (
        <p className="font-sans text-sm text-text-muted">No pending replacements</p>
      )}

      {feedback && (
        <div className="my-2">
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      {expanded && pendingCount > 0 && (
        <div className="space-y-3 mt-2">
          {loading ? (
            <p className="font-sans text-sm text-text-muted">Loading...</p>
          ) : replacements.length === 0 ? (
            <p className="font-sans text-sm text-text-muted">No pending replacements found</p>
          ) : (
            replacements.map((r) => (
              <div key={r.id} className="rounded-data border border-border bg-surface-alt p-3">
                {/* Original golfer */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    r.reason === "WD" ? "bg-[#FCEAE9] text-accent-danger" : "bg-[#FDF4E3] text-[#8A6B1E]"
                  }`}>
                    {r.reason}
                  </span>
                  <span className="font-sans text-sm font-medium text-text-primary line-through">
                    {r.originalGolferName}
                  </span>
                </div>

                {/* Proposed replacement */}
                <div className="mb-2">
                  <span className="font-sans text-xs text-text-muted">Proposed: </span>
                  <span className="font-sans text-sm font-medium text-text-primary">
                    {r.replacementGolferName}
                  </span>
                  {r.replacementScore !== null && (
                    <span className={`ml-1 font-mono text-xs ${
                      r.replacementScore < 0 ? "text-accent-success" : r.replacementScore > 0 ? "text-accent-danger" : "text-text-secondary"
                    }`}>
                      ({r.replacementScore > 0 ? `+${r.replacementScore}` : r.replacementScore === 0 ? "E" : r.replacementScore})
                    </span>
                  )}
                </div>

                {/* Affected entry */}
                <p className="font-sans text-xs text-text-secondary mb-3">
                  {r.categoryName} · {r.playerName}{r.entryNumber > 1 ? ` (E${r.entryNumber})` : ""}
                </p>

                {/* Override mode */}
                {overrideId === r.id ? (
                  <div className="space-y-2">
                    <div>
                      <label className="font-sans text-xs font-medium text-text-secondary block mb-1">
                        Select replacement golfer:
                      </label>
                      {eligibleGolfers.length > 0 ? (
                        <select
                          value={selectedOverride}
                          onChange={(e) => setSelectedOverride(e.target.value)}
                          className="w-full rounded-[6px] border border-border bg-surface px-3 py-2 font-sans text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15"
                        >
                          <option value="">Choose a golfer...</option>
                          {eligibleGolfers.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} {g.score !== null ? `(${g.score > 0 ? "+" : ""}${g.score === 0 ? "E" : g.score})` : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="font-sans text-xs text-text-muted">
                          Loading eligible golfers...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        loading={processingId === r.id}
                        onClick={() => handleOverride(r)}
                        className="flex-1"
                      >
                        Save Override
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => { setOverrideId(null); setSelectedOverride(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      loading={processingId === r.id}
                      onClick={() => handleConfirm(r)}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => startOverride(r)}
                    >
                      Override
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
