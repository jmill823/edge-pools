"use client";

import { useState, useCallback } from "react";

interface AcceptingMembersToggleProps {
  poolId: string;
  status: string;
  acceptingMembers: boolean;
  onAcceptingChange: (accepting: boolean) => void;
}

export function AcceptingMembersToggle({ poolId, status, acceptingMembers, onAcceptingChange }: AcceptingMembersToggleProps) {
  const [loading, setLoading] = useState(false);

  // Only interactive in SETUP and OPEN
  const canToggle = ["SETUP", "OPEN"].includes(status);

  const toggle = useCallback(async () => {
    if (!canToggle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptingMembers: !acceptingMembers }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      onAcceptingChange(updated.acceptingMembers);
    } catch {
      // Silent fail — toggle reverts visually
    } finally {
      setLoading(false);
    }
  }, [poolId, acceptingMembers, canToggle, onAcceptingChange]);

  return (
    <div className={`rounded-card border border-border bg-surface p-4 flex items-center justify-between gap-3 ${!canToggle ? "opacity-60" : ""}`}>
      <div>
        <p className="font-sans text-sm font-medium text-text-primary">Accepting new members</p>
        <p className="font-sans text-xs text-text-muted mt-0.5">
          {acceptingMembers
            ? "Anyone with the invite link can join"
            : "Pool is closed to new members"}
        </p>
        {!canToggle && (
          <p className="font-sans text-[10px] text-text-muted mt-1">
            Cannot change after picks are locked.
          </p>
        )}
      </div>
      <button
        onClick={toggle}
        disabled={loading || !canToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 min-w-[48px] ${
          canToggle ? "cursor-pointer" : "cursor-not-allowed"
        } ${acceptingMembers ? "bg-accent-success" : "bg-text-muted"}`}
        role="switch"
        aria-checked={acceptingMembers}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            acceptingMembers ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
