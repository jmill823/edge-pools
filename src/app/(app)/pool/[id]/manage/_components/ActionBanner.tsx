"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { ConfirmModal } from "./ConfirmModal";

interface ActionBannerProps {
  poolId: string;
  status: string;
  categoryCount: number;
  picksDeadline: string;
  lastSyncAt: string | null;
  pendingReplacements: number;
  winnerName: string | null;
  tournamentName: string;
  onStatusChange: (newStatus: string) => void;
  onSyncTimeUpdate: (time: string) => void;
}

const STATUS_BG: Record<string, string> = {
  SETUP: "bg-[#F5F1EB]",
  OPEN: "bg-[#FDF4E3]/60",
  LOCKED: "bg-[#F5F1EB]",
  LIVE: "bg-[#FCEAE9]/60",
  COMPLETE: "bg-[#E8F3ED]/60",
  ARCHIVED: "bg-[#F5F1EB]",
};

export function ActionBanner({
  poolId,
  status,
  categoryCount,
  picksDeadline,
  lastSyncAt,
  pendingReplacements,
  winnerName,
  tournamentName,
  onStatusChange,
  onSyncTimeUpdate,
}: ActionBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncTime, setSyncTime] = useState(lastSyncAt);
  const [countdown, setCountdown] = useState("");
  // M-3: Two-tap lock confirmation
  const [confirmingLock, setConfirmingLock] = useState(false);

  // Countdown timer for OPEN status
  useEffect(() => {
    if (status !== "OPEN" || !picksDeadline) return;

    const updateCountdown = () => {
      const deadline = new Date(picksDeadline);
      const now = Date.now();
      const diff = deadline.getTime() - now;

      if (diff <= 0) {
        setCountdown("Deadline passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [status, picksDeadline]);

  const transitionStatus = useCallback(async (targetStatus: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      const updated = await res.json();
      onStatusChange(updated.status);
      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }, [poolId, onStatusChange, router]);

  const pollScores = useCallback(async () => {
    setLoading(true);
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
      onSyncTimeUpdate(now);

      const totalUpdated = data.results?.reduce((sum: number, r: { golfersUpdated: number }) => sum + r.golfersUpdated, 0) ?? 0;
      setFeedback({
        type: "success",
        message: `${totalUpdated} golfer${totalUpdated !== 1 ? "s" : ""} updated`,
      });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Score update failed" });
    } finally {
      setLoading(false);
    }
  }, [poolId, onSyncTimeUpdate]);

  // Sync status for LIVE
  const getSyncStatus = () => {
    if (!syncTime) return { stale: false, delayed: false, text: "" };
    const minutesAgo = Math.floor((Date.now() - new Date(syncTime).getTime()) / 60000);
    const timeStr = new Date(syncTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return {
      stale: minutesAgo > 15,
      delayed: minutesAgo > 30,
      text: `Last sync: ${timeStr}`,
    };
  };

  const syncStatus = getSyncStatus();

  // Deadline display for OPEN
  const deadlineDate = new Date(picksDeadline);
  const deadlineDisplay = isNaN(deadlineDate.getTime())
    ? "—"
    : deadlineDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
      " at " +
      deadlineDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // SETUP checklist
  const hasCategories = categoryCount > 0;
  const hasDeadline = picksDeadline && !isNaN(new Date(picksDeadline).getTime());

  const bgClass = STATUS_BG[status] || "bg-[#F5F1EB]";

  // Confirmation messages for transitions
  const confirmMessages: Record<string, { title: string; desc: string }> = {
    OPEN: { title: "Open pool for entries?", desc: "Players will be able to join and submit picks." },
    LOCKED: { title: "Lock picks?", desc: "No more picks or edits after this. All entries will be permanently locked." },
    LIVE: { title: "Start live scoring?", desc: "The leaderboard will begin updating with live scores." },
    ARCHIVED: { title: "Archive pool?", desc: "This pool will move to past pools. It will still be viewable." },
  };

  return (
    <div className={`${bgClass} rounded-[6px] px-3 py-3`}>
      {feedback && (
        <div className="mb-2">
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      {/* SETUP */}
      {status === "SETUP" && (
        <>
          <p className="font-sans text-[13px] font-medium text-[#1A1A18]">
            Finish setting up your pool
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`font-sans text-[11px] ${hasCategories ? "text-[#2D7A4F]" : "text-[#8A6B1E]"}`}>
              {hasCategories ? "✓ Categories" : "0 categories"}
            </span>
            <span className={`font-sans text-[11px] ${hasDeadline ? "text-[#2D7A4F]" : "text-[#8A6B1E]"}`}>
              {hasDeadline ? "✓ Deadline" : "Not set"}
            </span>
            <span className="font-sans text-[11px] text-[#A39E96]">
              ✓ Default scoring
            </span>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="mt-3 w-full rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Updating..." : "Go Live"}
          </button>
        </>
      )}

      {/* OPEN */}
      {status === "OPEN" && (
        <>
          <div className="flex items-baseline justify-between">
            <p className="font-sans text-[13px] font-medium text-[#1A1A18]">
              Picks close in <span className="font-mono font-bold">{countdown}</span>
            </p>
          </div>
          <p className="font-sans text-[11px] text-[#6B6560] mt-0.5">
            {deadlineDisplay}
          </p>
          {/* M-3: Two-tap lock confirmation */}
          <button
            onClick={() => {
              if (confirmingLock) {
                // Second tap — execute lock
                transitionStatus("LOCKED");
                setConfirmingLock(false);
              } else {
                // First tap — show confirm state
                setConfirmingLock(true);
                setTimeout(() => setConfirmingLock(false), 3000);
              }
            }}
            disabled={loading}
            className={`mt-3 w-full rounded-[6px] border font-sans text-[13px] font-medium py-2.5 transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px] ${
              confirmingLock
                ? "border-[#A3342D] text-[#A3342D] bg-transparent hover:bg-[#FCEAE9]"
                : "border-[#8A6B1E] text-[#8A6B1E] bg-transparent hover:bg-[#FDF4E3]"
            }`}
          >
            {loading ? "Locking..." : confirmingLock ? "Confirm lock?" : "Lock Now"}
          </button>
        </>
      )}

      {/* LOCKED */}
      {status === "LOCKED" && (
        <>
          <p className="font-sans text-[13px] font-medium text-[#1A1A18]">
            Picks locked. Waiting for {tournamentName} to begin.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="mt-3 w-full rounded-[6px] border border-[#6B6560] bg-transparent text-[#6B6560] font-sans text-[13px] font-medium py-2.5 hover:bg-[#F5F1EB] transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Starting..." : "Start Scoring"}
          </button>
        </>
      )}

      {/* LIVE */}
      {status === "LIVE" && (
        <>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${
                syncStatus.delayed ? "bg-[#A3342D]" : syncStatus.stale ? "bg-[#C4973B]" : "bg-[#2D7A4F]"
              }`}
            />
            <p className="font-mono text-[11px] text-[#6B6560]">
              {syncStatus.text || "No scores yet"}
            </p>
          </div>
          {syncStatus.stale && (
            <p className="font-sans text-[11px] text-[#8A6B1E] mt-1">
              Scores may be delayed
            </p>
          )}
          {pendingReplacements > 0 && (
            <p className="font-sans text-[11px] text-[#A3342D] font-medium mt-1">
              {pendingReplacements} WD{pendingReplacements !== 1 ? "s" : ""} need review
            </p>
          )}
          <button
            onClick={pollScores}
            disabled={loading}
            className="mt-3 w-full rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Polling..." : "Poll Scores Now"}
          </button>
          <p className="font-sans text-[10px] text-[#A39E96] mt-1.5 text-center">
            Manual score entry available in row expansion (coming soon)
          </p>
        </>
      )}

      {/* COMPLETE */}
      {status === "COMPLETE" && (
        <>
          <p className="font-sans text-[13px] font-medium text-[#1A1A18]">
            Results are final.{winnerName ? ` ${winnerName} won!` : ""}
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="mt-3 w-full rounded-[6px] border border-[#A39E96] bg-transparent text-[#6B6560] font-sans text-[13px] font-medium py-2.5 hover:bg-[#F5F1EB] transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Archiving..." : "Archive Pool"}
          </button>
        </>
      )}

      {/* ARCHIVED */}
      {status === "ARCHIVED" && (
        <p className="font-sans text-[13px] text-[#6B6560]">
          This pool is archived.
        </p>
      )}

      {/* Confirm modal for status transitions */}
      {status === "SETUP" && (
        <ConfirmModal
          open={showConfirm}
          title={confirmMessages.OPEN?.title || ""}
          description={confirmMessages.OPEN?.desc || ""}
          confirmLabel="Go Live"
          confirmVariant="primary"
          loading={loading}
          onConfirm={() => transitionStatus("OPEN")}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {/* M-3: OPEN uses inline two-tap — no modal needed */}
      {status === "LOCKED" && (
        <ConfirmModal
          open={showConfirm}
          title={confirmMessages.LIVE?.title || ""}
          description={confirmMessages.LIVE?.desc || ""}
          confirmLabel="Start Scoring"
          confirmVariant="primary"
          loading={loading}
          onConfirm={() => transitionStatus("LIVE")}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {status === "COMPLETE" && (
        <ConfirmModal
          open={showConfirm}
          title={confirmMessages.ARCHIVED?.title || ""}
          description={confirmMessages.ARCHIVED?.desc || ""}
          confirmLabel="Archive Pool"
          confirmVariant="secondary"
          loading={loading}
          onConfirm={() => transitionStatus("ARCHIVED")}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
