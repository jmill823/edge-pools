"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreDrawer } from "./MoreDrawer";

interface BottomNavProps {
  poolId: string;
  isOrganizer: boolean;
}

interface NavTab {
  label: string;
  href: string;
  segment: string;
  icon: (active: boolean) => React.ReactNode;
}

export function BottomNav({ poolId, isOrganizer }: BottomNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const poolRoute = isOrganizer ? `/pool/${poolId}/manage` : `/pool/${poolId}`;

  const tabs: NavTab[] = [
    {
      label: "HOME",
      href: "/dashboard",
      segment: "dashboard",
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      label: "BOARD",
      href: `/pool/${poolId}/leaderboard`,
      segment: "leaderboard",
      icon: (active) => <BoardIcon active={active} />,
    },
    {
      label: "PICKS",
      href: `/pool/${poolId}/picks`,
      segment: "picks",
      icon: (active) => <PicksIcon active={active} />,
    },
    {
      label: "POOL",
      href: poolRoute,
      segment: isOrganizer ? "manage" : "pool-root",
      icon: (active) => <PoolIcon active={active} />,
    },
  ];

  function isActive(segment: string) {
    if (segment === "dashboard") return pathname === "/dashboard";
    if (segment === "pool-root") return pathname === `/pool/${poolId}`;
    return pathname.includes(`/pool/${poolId}/${segment}`);
  }

  const moreActive = drawerOpen;

  return (
    <>
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white safe-area-pb"
        style={{ borderTop: "0.5px solid var(--neutral-light-border)", height: "56px" }}
      >
        <div className="flex h-full">
          {tabs.map((tab) => {
            const active = isActive(tab.segment);
            return (
              <Link
                key={tab.segment}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center cursor-pointer"
              >
                {tab.icon(active)}
                <span
                  className="mt-[2px] font-sans text-[7px] font-semibold uppercase"
                  style={{
                    letterSpacing: "1px",
                    color: active ? "var(--theme-active)" : "var(--neutral-icon)",
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <span
                    className="mt-[2px] rounded-full"
                    style={{ width: "4px", height: "4px", background: "var(--theme-active)" }}
                  />
                )}
              </Link>
            );
          })}

          {/* MORE tab */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer"
          >
            <MoreIcon active={moreActive} />
            <span
              className="mt-[2px] font-sans text-[7px] font-semibold uppercase"
              style={{
                letterSpacing: "1px",
                color: moreActive ? "var(--theme-active)" : "var(--neutral-icon)",
                fontWeight: moreActive ? 700 : 600,
              }}
            >
              MORE
            </span>
            {moreActive && (
              <span
                className="mt-[2px] rounded-full"
                style={{ width: "4px", height: "4px", background: "var(--theme-active)" }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {drawerOpen && (
        <MoreDrawer poolId={poolId} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}

/* ─── Icons (stroke, no fill, 20×20, strokeWidth 2) ─── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--theme-active)" : "var(--neutral-icon)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BoardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--theme-active)" : "var(--neutral-icon)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function PicksIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--theme-active)" : "var(--neutral-icon)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function PoolIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--theme-active)" : "var(--neutral-icon)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4V7" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--theme-active)" : "var(--neutral-icon)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
