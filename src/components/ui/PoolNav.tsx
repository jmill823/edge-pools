"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShareModal } from "./ShareModal";

interface PoolNavProps {
  poolId: string;
  poolName: string;
  poolStatus: string;
  isOrganizer: boolean;
  inviteCode?: string;
}

interface Tab {
  label: string;
  href: string;
  segment: string;
  orgOnly?: boolean;
}

export function PoolNav({ poolId, poolName, poolStatus, isOrganizer, inviteCode }: PoolNavProps) {
  const pathname = usePathname();
  const [showShare, setShowShare] = useState(false);

  const tabs: Tab[] = [
    { label: "Picks", href: `/pool/${poolId}/picks`, segment: "picks" },
    { label: "Leaderboard", href: `/pool/${poolId}/leaderboard`, segment: "leaderboard" },
    { label: "My Entries", href: `/pool/${poolId}/my-entries`, segment: "my-entries" },
    { label: "Manage", href: `/pool/${poolId}/manage`, segment: "manage", orgOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.orgOnly || isOrganizer);
  const canShare = poolStatus === "OPEN" && inviteCode;

  function isActive(segment: string) {
    return pathname.includes(`/pool/${poolId}/${segment}`);
  }

  return (
    <>
      {/* Pool name */}
      <div className="px-4 pt-4 pb-1">
        <div className="mx-auto w-full sm:max-w-[60%] text-center flex items-center justify-center gap-2">
          <h1 className="font-sans text-lg font-bold truncate" style={{ color: "var(--neutral-text)" }}>{poolName}</h1>
          {canShare && (
            <button
              onClick={() => setShowShare(true)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--neutral-you-row)] transition-colors duration-150 cursor-pointer"
              aria-label="Share pool"
              title="Invite a friend"
            >
              <svg className="h-4 w-4" style={{ color: "var(--neutral-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v-2M22 12l-4-4m4 4l-4 4m4-4H9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Desktop tabs — gold active state */}
      <nav className="hidden sm:block sticky top-0 z-30">
        <div className="flex justify-center gap-6">
          {visibleTabs.map((tab) => {
            const active = isActive(tab.segment);
            return (
              <Link
                key={tab.segment}
                href={tab.href}
                className="text-center px-3 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.3px] transition-colors duration-200 border-b-2 cursor-pointer"
                style={{
                  borderBottomColor: active ? "var(--theme-active)" : "transparent",
                  color: active ? "var(--theme-active)" : "var(--neutral-secondary)",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom bar removed — BottomNav component handles mobile nav */}

      {/* Share modal */}
      {showShare && inviteCode && (
        <ShareModal
          poolName={poolName}
          inviteCode={inviteCode}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
