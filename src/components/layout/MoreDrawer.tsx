"use client";

import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";

interface MoreDrawerProps {
  poolId: string;
  onClose: () => void;
}

interface MenuItem {
  icon: string;
  label: string;
  route: string | null;
  ghosted?: boolean;
}

export function MoreDrawer({ poolId, onClose }: MoreDrawerProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  const hasPool = !!poolId;

  // Active items
  const activeItems: MenuItem[] = [
    { icon: "home", label: "Home", route: "/dashboard" },
    ...(hasPool
      ? [
          { icon: "board", label: "Board", route: `/pool/${poolId}/leaderboard` },
          { icon: "picks", label: "Picks", route: `/pool/${poolId}/picks` },
          { icon: "pool", label: "Pool", route: `/pool/${poolId}/manage` },
        ]
      : []),
    { icon: "user", label: "Account", route: "/account" },
  ];

  // Ghosted items (visible but disabled)
  const ghostedItems: MenuItem[] = [
    { icon: "calendar", label: "Schedule", route: null, ghosted: true },
    { icon: "book", label: "Rules", route: null, ghosted: true },
    { icon: "bell", label: "Notifications", route: null, ghosted: true },
  ];

  function handleItemClick(item: MenuItem) {
    if (item.ghosted || !item.route) return;
    router.push(item.route);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ background: "var(--theme-dark)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* TILT wordmark — white/cream, not gradient */}
        <div style={{ transform: "rotate(-3deg)" }}>
          <span
            className="font-sans text-[22px] font-black italic leading-none"
            style={{ letterSpacing: "-0.5px", color: "rgba(255,255,255,0.9)" }}
          >
            TILT
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center cursor-pointer"
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {/* Active items */}
        {activeItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item)}
            className="w-full flex items-center gap-4 py-4 cursor-pointer"
            style={{ borderBottom: "0.5px solid rgba(255,255,255,0.12)" }}
          >
            <MenuIcon name={item.icon} />
            <span className="font-sans text-[14px] font-medium text-white">
              {item.label}
            </span>
          </button>
        ))}

        {/* Ghosted items */}
        {ghostedItems.map((item) => (
          <div
            key={item.label}
            className="w-full flex items-center gap-4 py-4"
            style={{ borderBottom: "0.5px solid rgba(255,255,255,0.12)" }}
          >
            <MenuIcon name={item.icon} ghosted />
            <span className="font-sans text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom auth buttons */}
      <div className="px-4 pb-4" style={{ paddingBottom: "calc(16px + 56px + env(safe-area-inset-bottom, 0px))" }}>
        <SignedOut>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { router.push("/sign-up"); onClose(); }}
              className="w-full rounded-[8px] bg-transparent py-3 font-sans text-[12px] font-semibold text-white cursor-pointer min-h-[44px]"
              style={{ border: "1.5px solid var(--theme-active)" }}
            >
              Sign Up
            </button>
            <button
              onClick={() => { router.push("/sign-in"); onClose(); }}
              className="w-full rounded-[8px] py-3 font-sans text-[12px] font-semibold text-white cursor-pointer min-h-[44px]"
              style={{ background: "var(--theme-active)" }}
            >
              Log In
            </button>
          </div>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => signOut()}
            className="w-full text-center font-sans text-[12px] font-medium cursor-pointer py-3"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Sign Out
          </button>
        </SignedIn>
      </div>
    </div>
  );
}

/* ─── Menu Icons (24×24, stroke, theme-active color) ─── */

function MenuIcon({ name, ghosted = false }: { name: string; ghosted?: boolean }) {
  const color = ghosted ? "rgba(255,255,255,0.3)" : "var(--theme-active)";

  switch (name) {
    case "home":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "board":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="16" y2="18" />
        </svg>
      );
    case "picks":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case "pool":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4V7" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "settings":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "book":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "bell":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case "user":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}
