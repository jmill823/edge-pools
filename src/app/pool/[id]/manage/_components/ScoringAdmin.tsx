"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { ReplacementQueue } from "./ReplacementQueue";
import { ManualScoreEntry } from "./ManualScoreEntry";

interface ScoringAdminProps {
  poolId: string;
  tournamentId: string;
  status: string;
  lastSyncAt: string | null;
  pendingReplacements: number;
}

export function ScoringAdmin({ poolId, tournamentId, status, lastSyncAt, pendingReplacements }: ScoringAdminProps) {
  const [polling, setPolling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncTime, setSyncTime] = useState(lastSyncAt);
  const [replacementCount, setReplacementCount] = useState(pendingReplacements);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const isLive = status === "LIVE";

  const pollScores = useCallback(async () => {
    setPolling(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/poll-scores`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Score update failed");
      }
      const data = await res.json();
      const now = new Date().toISOString();
      setSyncTime(now);

      const totalUpdated = data.results?.reduce((sum: number, r: { golfersUpdated: number }) => sum + r.golfersUpdated, 0) ?? 0;
      const totalReplacements = data.results?.reduce((sum: number, r: { replacementsFlagged: number }) => sum + r.replacementsFlagged, 0) ?? 0;

      if (totalReplacements > 0) {
        setReplacementCount((c) => c + totalReplacements);
      }

      setFeedback({
        type: "success",
        message: `${totalUpdated} golfer${totalUpdated !== 1 ? "s" : ""} updated at ${new Date(now).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Score update failed — try again" });
    } finally {
      setPolling(false);
    }
  }, [poolId]);

  const handleReplacementProcessed = useCallback(() => {
    setReplacementCount((c) => Math.max(0, c - 1));
  }, []);

  const getSyncStatus = () => {
    if (!syncTime) return { text: "No scores yet", level: "neutral" as const };
    const syncDate = new Date(syncTime);
    const minutesAgo = Math.floor((Date.now() - syncDate.getTime()) / 60000);
    const timeStr = syncDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (isLive && minutesAgo > 30) {
      return { text: `Last updated: ${timeStr} (${minutesAgo}m ago)`, level: "danger" as const };
    }
    if (isLive && minutesAgo > 15) {
      return { text: `Last updated: ${timeStr} (${minutesAgo}m ago)`, level: "warning" as const };
    }
    return { text: `Scores last updated: ${timeStr}`, level: "ok" as const };
  };

  const syncStatus = getSyncStatus();

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
        Scoring
      </p>

      {/* Sync status */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`h-2 w-2 rounded-full shrink-0 ${
            syncStatus.level === "danger"
              ? "bg-accent-danger"
              : syncStatus.level === "warning"
              ? "bg-[#C4973B]"
              : syncStatus.level === "ok"
              ? "bg-accent-success"
              : "bg-text-muted"
          }`}
        />
        <p className={`font-mono text-xs ${
          syncStatus.level === "danger"
            ? "text-accent-danger"
            : syncStatus.level === "warning"
            ? "text-[#8A6B1E]"
            : "text-text-secondary"
        }`}>
          {syncStatus.text}
        </p>
      </div>

      {syncStatus.level === "warning" && isLive && (
        <div className="mb-3 rounded-data bg-[#FDF4E3] px-3 py-2">
          <p className="font-body text-xs text-[#8A6B1E]">
            Scores may be delayed. Try polling manually.
          </p>
        </div>
      )}

      {syncStatus.level === "danger" && isLive && (
        <div className="mb-3 rounded-data bg-[#FCEAE9] px-3 py-2">
          <p className="font-body text-xs text-accent-danger">
            Scores haven&apos;t updated in over 30 minutes.
          </p>
        </div>
      )}

      {feedback && (
        <div className="mb-3">
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      {/* Poll button — only when LIVE */}
      {isLive && (
        <Button
          variant="secondary"
          loading={polling}
          onClick={pollScores}
          className="w-full mb-4"
        >
          Poll Scores Now
        </Button>
      )}

      {/* WD/CUT Replacement Queue */}
      {isLive && (
        <div className="border-t border-border pt-3 mt-3">
          <ReplacementQueue
            poolId={poolId}
            pendingCount={replacementCount}
            onReplacementProcessed={handleReplacementProcessed}
          />
        </div>
      )}

      {/* Manual Score Entry — only when LIVE */}
      {isLive && (
        <div className="border-t border-border pt-3 mt-3">
          <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-2">
            Manual Fallback
          </p>
          {showManualEntry ? (
            <ManualScoreEntry
              tournamentId={tournamentId}
              onClose={() => setShowManualEntry(false)}
              onScoresUpdated={() => {
                setSyncTime(new Date().toISOString());
                setFeedback({ type: "success", message: "Manual scores saved and standings recalculated" });
              }}
            />
          ) : (
            <button
              onClick={() => setShowManualEntry(true)}
              className="font-body text-sm text-accent-primary hover:underline cursor-pointer"
            >
              Enter scores manually &rarr;
            </button>
          )}
        </div>
      )}

      {/* Non-live states */}
      {!isLive && status !== "COMPLETE" && status !== "ARCHIVED" && (
        <p className="font-body text-xs text-text-muted">
          Scoring controls will be available when the pool is live.
        </p>
      )}
    </div>
  );
}
