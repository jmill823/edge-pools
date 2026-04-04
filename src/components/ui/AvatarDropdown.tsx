"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function AvatarDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const displayName = user?.fullName || user?.firstName || "User";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary text-white font-display text-xs font-bold cursor-pointer hover:brightness-90 transition-all duration-200"
        aria-label="User menu"
      >
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[200px] rounded-card border border-border bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50">
          {/* User name */}
          <div className="px-4 py-3 border-b border-border">
            <span className="block font-body text-sm font-medium text-text-primary truncate">
              {displayName}
            </span>
          </div>

          {/* Nav items */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push("/dashboard"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] font-body text-sm text-text-primary hover:bg-surface-alt transition-colors duration-150 cursor-pointer"
            >
              <svg className="h-4 w-4 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4v11H3zM10 3h4v18h-4zM17 7h4v14h-4z" />
              </svg>
              Dashboard
            </button>
          </div>

          {/* Divider + Sign out */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] font-body text-sm text-text-primary hover:bg-surface-alt transition-colors duration-150 cursor-pointer"
            >
              <svg className="h-4 w-4 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
