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
      {/* Pool name — no border, no background, floats on cream */}
      <div className="px-4 pt-4 pb-1">
        <div className="mx-auto w-full sm:max-w-[60%] text-center flex items-center justify-center gap-2">
          <h1 className="font-display text-lg font-bold text-text-primary truncate">{poolName}</h1>
          {canShare && (
            <button
              onClick={() => setShowShare(true)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-alt transition-colors duration-150 cursor-pointer"
              aria-label="Share pool"
              title="Invite a friend"
            >
              <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v-2M22 12l-4-4m4 4l-4 4m4-4H9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Desktop tabs — no background, no border on the nav itself */}
      <nav className="hidden sm:block sticky top-0 z-30">
        <div className="mx-auto max-w-[70%] flex">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.segment}
              href={tab.href}
              className={`flex-1 text-center px-4 py-3 font-display text-[13px] font-medium transition-colors duration-200 border-b-2 cursor-pointer ${
                isActive(tab.segment)
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile bottom tab bar — unchanged, full width */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface safe-area-pb">
        <div className="flex">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.segment}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] font-display text-xs font-medium transition-colors duration-200 cursor-pointer ${
                isActive(tab.segment)
                  ? "text-accent-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <TabIcon segment={tab.segment} active={isActive(tab.segment)} />
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>

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

function TabIcon({ segment, active }: { segment: string; active: boolean }) {
  const cls = `h-5 w-5 ${active ? "text-accent-primary" : "text-text-muted"}`;

  switch (segment) {
    case "picks":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4v11H3zM10 3h4v18h-4zM17 7h4v14h-4z" />
        </svg>
      );
    case "my-entries":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "manage":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}
