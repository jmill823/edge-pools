"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "tilt_role_seen";

interface RoleSelectorProps {
  onSelectCommissioner: () => void;
  onSelectPlayer: () => void;
}

export function RoleSelector({ onSelectCommissioner, onSelectPlayer }: RoleSelectorProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleJoin() {
    dismiss();
    onSelectPlayer();
  }

  function handleCreate() {
    dismiss();
    onSelectCommissioner();
  }

  function handleSwitch() {
    dismiss();
    router.push("/switch");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px]" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[380px] rounded-[12px] bg-surface p-8 px-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TILT wordmark — gold gradient, rotated */}
        <div className="flex justify-center">
          <div style={{ transform: "rotate(-3deg)" }} className="flex flex-col items-center">
            <h2
              className="font-sans text-[36px] font-black italic leading-none"
              style={{
                letterSpacing: "-1px",
                background: "linear-gradient(180deg, var(--brand-gold-gradient-start), var(--brand-gold-gradient-end))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TILT
            </h2>
            <div
              className="mt-[2px]"
              style={{
                width: "32px",
                height: "2px",
                background: "var(--brand-gold-rule)",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>

        {/* 3 action buttons — gold ghost */}
        <div className="flex flex-col gap-3 mt-5">
          <button
            onClick={handleJoin}
            className="w-full rounded-[8px] bg-transparent px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:bg-[var(--bg-brand)] active:scale-[0.98] min-h-[44px]"
            style={{ border: "2px solid var(--brand-gold-cta-border)" }}
          >
            <span className="block font-sans text-[18px] font-bold" style={{ color: "var(--brand-gold-cta-text)" }}>
              JOIN
            </span>
            <span className="block font-sans text-[12px] mt-0.5" style={{ color: "var(--neutral-secondary)" }}>
              Enter a pool
            </span>
          </button>

          <button
            onClick={handleCreate}
            className="w-full rounded-[8px] bg-transparent px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:bg-[var(--bg-brand)] active:scale-[0.98] min-h-[44px]"
            style={{ border: "2px solid var(--brand-gold-cta-border)" }}
          >
            <span className="block font-sans text-[18px] font-bold" style={{ color: "var(--brand-gold-cta-text)" }}>
              CREATE
            </span>
            <span className="block font-sans text-[12px] mt-0.5" style={{ color: "var(--neutral-secondary)" }}>
              Start a new pool
            </span>
          </button>

          <button
            onClick={handleSwitch}
            className="w-full rounded-[8px] bg-transparent px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:bg-[var(--bg-brand)] active:scale-[0.98] min-h-[44px]"
            style={{ border: "2px solid var(--brand-gold-cta-border)" }}
          >
            <span className="block font-sans text-[18px] font-bold" style={{ color: "var(--brand-gold-cta-text)" }}>
              SWITCH
            </span>
            <span className="block font-sans text-[12px] mt-0.5" style={{ color: "var(--neutral-secondary)" }}>
              Ditch the spreadsheet
            </span>
          </button>
        </div>

        {/* Skip link */}
        <button
          onClick={dismiss}
          className="mt-4 w-full text-center font-sans text-[10px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          style={{ color: "var(--neutral-icon)" }}
        >
          Just browsing
        </button>
      </div>
    </div>
  );
}
