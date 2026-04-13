"use client";

import { useState, useCallback } from "react";

interface StatCardsProps {
  memberCount: number;
  totalEntries: number;
  paidEntries: number;
  poolId: string;
  status: string;
  acceptingMembers: boolean;
  onAcceptingChange: (accepting: boolean) => void;
  onPaidTap: () => void;
}

export function StatCards({
  memberCount,
  totalEntries,
  paidEntries,
  poolId,
  status,
  acceptingMembers,
  onAcceptingChange,
  onPaidTap,
}: StatCardsProps) {
  const [toggling, setToggling] = useState(false);
  const showToggle = ["SETUP", "OPEN"].includes(status);

  const toggleAccepting = useCallback(async () => {
    setToggling(true);
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
      // Silent fail — toggle reverts
    } finally {
      setToggling(false);
    }
  }, [poolId, acceptingMembers, onAcceptingChange]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* MEMBERS */}
      <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
        <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">
          MEMBERS
        </p>
        <p className="font-mono text-[20px] font-bold text-[#1A1A18] leading-tight">
          {memberCount}
        </p>
        {showToggle && (
          <button
            onClick={toggleAccepting}
            disabled={toggling}
            className="mt-2 flex items-center gap-1.5 cursor-pointer"
          >
            <span
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ${
                acceptingMembers ? "bg-[#2D7A4F]" : "bg-[#A39E96]"
              }`}
              role="switch"
              aria-checked={acceptingMembers}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  acceptingMembers ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className="font-sans text-[9px] text-[#6B6560]">
              {acceptingMembers ? "Accepting" : "Closed"}
            </span>
          </button>
        )}
      </div>

      {/* ENTRIES */}
      <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
        <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">
          ENTRIES
        </p>
        <p className="font-mono text-[20px] font-bold text-[#1A1A18] leading-tight">
          {totalEntries}
        </p>
      </div>

      {/* PAID */}
      <button
        onClick={onPaidTap}
        className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px] text-left cursor-pointer hover:bg-[#F5F2EB] transition-colors duration-200"
      >
        <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">
          PAID
        </p>
        <p className="font-mono text-[20px] font-bold leading-tight">
          <span className="text-[#2D7A4F]">{paidEntries}</span>
          <span className="text-[#A39E96]">/{totalEntries}</span>
        </p>
      </button>
    </div>
  );
}
