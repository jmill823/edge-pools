"use client";

import { useState, useCallback } from "react";

export interface MemberRow {
  id: string;
  displayName: string;
  role: string;
  hasPaid: boolean;
  entryCount: number;
  completePicks: number;
  isGuest: boolean;
  // For guest entries, this is the entryId for payment toggle
  entryId?: string;
  email?: string | null;
  paymentStatus?: string;
}

interface MembersGridProps {
  members: MemberRow[];
  poolId: string;
  status: string;
  maxEntries: number;
  onMemberPaidToggle: (memberId: string, newPaid: boolean) => void;
  onGuestPaidToggle: (entryId: string, newStatus: string) => void;
}

export function MembersGrid({
  members,
  poolId,
  status,
  maxEntries,
  onMemberPaidToggle,
  onGuestPaidToggle,
}: MembersGridProps) {
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const isArchived = status === "ARCHIVED";
  const showPicks = status !== "SETUP";

  // Sort: unpaid first, then alphabetical
  const sorted = [...members].sort((a, b) => {
    const aPaid = a.isGuest ? a.paymentStatus === "paid" : a.hasPaid;
    const bPaid = b.isGuest ? b.paymentStatus === "paid" : b.hasPaid;
    if (aPaid !== bPaid) return aPaid ? 1 : -1;
    return a.displayName.localeCompare(b.displayName);
  });

  const toggleMemberPaid = useCallback(async (memberId: string, currentPaid: boolean) => {
    setToggleLoading(memberId);
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid: !currentPaid }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onMemberPaidToggle(memberId, !currentPaid);
    } catch {
      // Silent fail
    } finally {
      setToggleLoading(null);
    }
  }, [poolId, onMemberPaidToggle]);

  const toggleGuestPaid = useCallback(async (entryId: string, currentStatus: string) => {
    setToggleLoading(entryId);
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      const res = await fetch(`/api/pools/${poolId}/entries/${entryId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onGuestPaidToggle(entryId, newStatus);
    } catch {
      // Silent fail
    } finally {
      setToggleLoading(null);
    }
  }, [poolId, onGuestPaidToggle]);

  // Picks display helper: fraction = complete entries / max entries allowed
  const getPicksBadge = (row: MemberRow) => {
    if (!showPicks) return null;
    const total = row.isGuest ? 1 : maxEntries;
    const complete = row.completePicks;
    if (complete >= total && total > 0) {
      return { text: `${complete}/${total}`, color: "bg-[#2D7A4F]" };
    }
    if (complete > 0) {
      return { text: `${complete}/${total}`, color: "bg-[#8A6B1E]" };
    }
    return { text: `0/${total}`, color: "bg-[#A3342D]" };
  };

  return (
    <div className="border-[0.5px] border-[#E2DDD5] rounded-[8px] overflow-hidden">
      {/* M-2: Gold header row — 36px, rounded top corners */}
      <div className="flex items-center bg-[#B09A60] px-3 h-[36px] rounded-t-[8px]">
        <span className="flex-1 font-sans text-[9px] font-medium text-white uppercase tracking-[0.5px]">
          MEMBER
        </span>
        <span className="w-[44px] text-center font-sans text-[9px] font-medium text-white uppercase tracking-[0.5px]">
          PAID
        </span>
        <span className="w-[44px] text-center font-sans text-[9px] font-medium text-white uppercase tracking-[0.5px]">
          ENT
        </span>
        <span className="w-[52px] text-center font-sans text-[9px] font-medium text-white uppercase tracking-[0.5px]">
          PICKS
        </span>
      </div>

      {/* Member rows */}
      {sorted.length === 0 ? (
        <div className="px-3 py-8 text-center font-sans text-sm text-[#A39E96]">
          No members yet
        </div>
      ) : (
        sorted.map((row) => {
          const isPaid = row.isGuest ? row.paymentStatus === "paid" : row.hasPaid;
          const paidNeverToggled = !row.isGuest && !row.hasPaid; // For the "never toggled" outline state
          const picksBadge = getPicksBadge(row);
          const rowKey = row.isGuest ? `guest-${row.entryId}` : row.id;
          const isLoading = toggleLoading === (row.isGuest ? row.entryId : row.id);

          // Role subtitle
          let roleText = "Player";
          if (row.role === "ORGANIZER") roleText = "Organizer";
          if (row.isGuest) roleText = "Player · guest";

          return (
            <div
              key={rowKey}
              className="flex items-center h-[44px] px-3 border-b border-[#E2DDD5] last:border-b-0 bg-white"
            >
              {/* MEMBER column */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <p className="font-sans text-[12px] font-medium text-[#1A1A18] truncate">
                    {row.displayName}
                  </p>
                  {row.isGuest && (
                    <span className="shrink-0 font-sans text-[9px] font-medium text-[#3B6B8A] bg-[#3B6B8A]/10 rounded-[3px] px-1 py-0.5">
                      Guest
                    </span>
                  )}
                </div>
                <p className="font-sans text-[9px] text-[#A39E96] truncate leading-tight">
                  {roleText}
                </p>
              </div>

              {/* PAID column */}
              <div className="w-[44px] flex justify-center">
                <button
                  onClick={() => {
                    if (isArchived) return;
                    if (row.isGuest && row.entryId) {
                      toggleGuestPaid(row.entryId, row.paymentStatus || "unpaid");
                    } else {
                      toggleMemberPaid(row.id, row.hasPaid);
                    }
                  }}
                  disabled={isArchived || isLoading}
                  className={`flex h-5 w-5 items-center justify-center rounded border-[1.5px] transition-colors duration-200 ${
                    isArchived ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                  } ${
                    isPaid
                      ? "border-[#2D7A4F] bg-[#2D7A4F] text-white"
                      : paidNeverToggled
                      ? "border-[#E2DDD5] bg-white"
                      : "border-[#A3342D] bg-white"
                  } ${isLoading ? "opacity-50" : ""}`}
                  aria-label={`Mark ${row.displayName} as ${isPaid ? "unpaid" : "paid"}`}
                >
                  {isPaid && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!isPaid && !paidNeverToggled && (
                    <svg className="h-3 w-3 text-[#A3342D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>

              {/* ENT column */}
              <div className="w-[44px] flex justify-center">
                <span className="font-mono text-[12px] text-[#1A1A18]">
                  {row.entryCount}
                </span>
              </div>

              {/* PICKS column */}
              <div className="w-[52px] flex justify-center">
                {!showPicks ? (
                  <span className="font-mono text-[12px] text-[#A39E96]">—</span>
                ) : picksBadge ? (
                  <span className={`${picksBadge.color} text-white font-mono text-[9px] font-medium rounded-[3px] px-1.5 py-0.5`}>
                    {picksBadge.text}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
