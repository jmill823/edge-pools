"use client";

import { useState, useCallback } from "react";

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  hasPaid: boolean;
  joinedAt: string;
  entriesSubmitted: number;
}

interface PlayerStatusTrackerProps {
  poolId: string;
  members: MemberData[];
  onMembersChange: (members: MemberData[]) => void;
}

export function PlayerStatusTracker({ poolId, members, onMembersChange }: PlayerStatusTrackerProps) {
  const [paidLoading, setPaidLoading] = useState<string | null>(null);

  // Sort: incomplete actions first (no picks or unpaid), then alphabetical
  const sorted = [...members].sort((a, b) => {
    const aIncomplete = (a.entriesSubmitted === 0 ? 1 : 0) + (a.hasPaid ? 0 : 1);
    const bIncomplete = (b.entriesSubmitted === 0 ? 1 : 0) + (b.hasPaid ? 0 : 1);
    if (aIncomplete !== bIncomplete) return bIncomplete - aIncomplete;
    return a.displayName.localeCompare(b.displayName);
  });

  const togglePaid = useCallback(async (memberId: string, currentPaid: boolean) => {
    setPaidLoading(memberId);
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid: !currentPaid }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onMembersChange(
        members.map((m) => (m.id === memberId ? { ...m, hasPaid: !currentPaid } : m))
      );
    } catch {
      // Error handled silently — checkbox reverts visually
    } finally {
      setPaidLoading(null);
    }
  }, [poolId, members, onMembersChange]);

  // Summary counts
  const totalMembers = members.length;
  const signedUpCount = totalMembers; // All members are signed up by definition
  const picksSetCount = members.filter((m) => m.entriesSubmitted > 0).length;
  const paidCount = members.filter((m) => m.hasPaid).length;

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-alt">
        <p className="font-display text-sm font-semibold text-text-primary">
          Player Status
        </p>
      </div>

      {/* Column headers */}
      {totalMembers > 0 && (
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2 border-b border-border">
          <div />
          <div className="grid grid-cols-4 gap-3 text-center" style={{ minWidth: "160px" }}>
            <span className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px]">
              Invited
            </span>
            <span className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px]">
              Signed up
            </span>
            <span className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px]">
              Picks
            </span>
            <span className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px]">
              Paid
            </span>
          </div>
        </div>
      )}

      {/* Member rows */}
      {totalMembers === 0 ? (
        <p className="px-4 py-8 text-center font-body text-sm text-text-muted">
          No members yet
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((m) => {
            const hasPicksSet = m.entriesSubmitted > 0;
            return (
              <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-3">
                {/* Name + meta */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[13px] font-medium text-text-primary truncate">
                      {m.displayName}
                    </span>
                    {m.role === "ORGANIZER" && (
                      <span className="font-body text-[10px] font-medium text-accent-secondary bg-[#FDF4E3] rounded-data px-1.5 py-0.5 shrink-0">
                        Host
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-muted truncate mt-0.5">
                    {hasPicksSet ? (
                      <span>
                        {m.entriesSubmitted} {m.entriesSubmitted === 1 ? "entry" : "entries"}
                      </span>
                    ) : (
                      <span className="text-[#8A6B1E]">No picks yet</span>
                    )}
                  </p>
                </div>

                {/* Status columns */}
                <div className="grid grid-cols-4 gap-3 text-center" style={{ minWidth: "160px" }}>
                  {/* Invited — always ✓ since they joined via invite */}
                  <StatusCheck checked />
                  {/* Signed up — always ✓ since they're in the member list */}
                  <StatusCheck checked />
                  {/* Picks set */}
                  <StatusCheck checked={hasPicksSet} />
                  {/* Paid — interactive */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => togglePaid(m.id, m.hasPaid)}
                      disabled={paidLoading === m.id}
                      className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors duration-200 cursor-pointer ${
                        m.hasPaid
                          ? "border-accent-success bg-accent-success text-white"
                          : "border-border bg-surface hover:border-text-muted"
                      } ${paidLoading === m.id ? "opacity-50" : ""}`}
                      aria-label={`Mark ${m.displayName} as ${m.hasPaid ? "unpaid" : "paid"}`}
                    >
                      {m.hasPaid && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Summary strip */}
      {totalMembers > 0 && (
        <div className="grid grid-cols-4 gap-3 border-t border-border bg-surface-alt px-4 py-3">
          <SummaryCard label="Invited" count={totalMembers} total={totalMembers} />
          <SummaryCard label="Signed up" count={signedUpCount} total={totalMembers} />
          <SummaryCard label="Picks set" count={picksSetCount} total={totalMembers} />
          <SummaryCard label="Paid" count={paidCount} total={totalMembers} />
        </div>
      )}
    </div>
  );
}

function StatusCheck({ checked }: { checked: boolean }) {
  return (
    <div className="flex justify-center">
      {checked ? (
        <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-accent-success bg-accent-success text-white">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="h-6 w-6 rounded border-2 border-border bg-surface" />
      )}
    </div>
  );
}

function SummaryCard({ label, count, total }: { label: string; count: number; total: number }) {
  const isLow = count < total;
  return (
    <div className="text-center">
      <p className={`font-mono text-base font-bold ${isLow ? "text-[#8A6B1E]" : "text-text-primary"}`}>
        {count}/{total}
      </p>
      <p className="font-display text-[10px] font-medium text-text-muted uppercase tracking-[0.5px] mt-0.5">
        {label}
      </p>
    </div>
  );
}
