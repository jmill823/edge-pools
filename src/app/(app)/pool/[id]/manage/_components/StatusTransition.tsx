"use client";

import { useState, useCallback } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { ConfirmModal } from "./ConfirmModal";

const TRANSITIONS: Record<
  string,
  { target: string; label: string; confirmation: string; variant: "primary" | "secondary" | "destructive" }
> = {
  SETUP: {
    target: "OPEN",
    label: "Open pool for entries",
    confirmation: "Players will be able to join and submit picks. You can still edit pool settings until you lock picks.",
    variant: "primary",
  },
  OPEN: {
    target: "LOCKED",
    label: "Lock picks",
    confirmation: "No more picks or edits after this. All entries will be permanently locked. Are you sure?",
    variant: "destructive",
  },
  LOCKED: {
    target: "LIVE",
    label: "Start live scoring",
    confirmation: "The leaderboard will begin updating with live scores from the tournament.",
    variant: "primary",
  },
  COMPLETE: {
    target: "ARCHIVED",
    label: "Archive pool",
    confirmation: "This pool will move to past pools. It will still be viewable but no longer active.",
    variant: "secondary",
  },
};

interface StatusTransitionProps {
  poolId: string;
  status: string;
  onStatusChange: (newStatus: string) => void;
}

export function StatusTransition({ poolId, status, onStatusChange }: StatusTransitionProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const transition = TRANSITIONS[status];

  const handleTransition = useCallback(async () => {
    if (!transition) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transition.target }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      const updated = await res.json();
      onStatusChange(updated.status);
      setFeedback({ type: "success", message: `Pool is now ${updated.status}` });
      setShowConfirm(false);
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }, [poolId, transition, onStatusChange]);

  const statusDescription: Record<string, string> = {
    SETUP: "Pool is being configured. Settings are editable.",
    OPEN: "Pool is accepting entries and picks.",
    LOCKED: "Picks are locked. Waiting for tournament to start.",
    LIVE: "Tournament is in progress. Scores are updating.",
    COMPLETE: "Tournament is complete. Final standings are set.",
    ARCHIVED: "Pool is archived.",
  };

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="font-sans text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mb-3">
        Pool Status
      </p>

      <div className="flex items-center gap-3 mb-2">
        <StatusBadge status={status} />
        <p className="font-sans text-sm text-text-secondary">
          {statusDescription[status] || ""}
        </p>
      </div>

      {feedback && (
        <div className="mt-3">
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {transition && (
        <div className="mt-4">
          <Button
            variant={transition.variant}
            onClick={() => setShowConfirm(true)}
            className="w-full"
          >
            {transition.label}
          </Button>
        </div>
      )}

      {/* LIVE has no manual transition — auto-completes */}
      {status === "LIVE" && (
        <p className="mt-3 font-sans text-xs text-text-muted">
          Pool will automatically complete when the tournament ends.
        </p>
      )}

      {status === "ARCHIVED" && (
        <p className="mt-3 font-sans text-xs text-text-muted">
          This pool is archived. No further changes.
        </p>
      )}

      <ConfirmModal
        open={showConfirm}
        title={transition ? `${transition.label}?` : ""}
        description={transition?.confirmation || ""}
        confirmLabel={transition?.label || "Confirm"}
        confirmVariant={transition?.variant}
        loading={loading}
        onConfirm={handleTransition}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
