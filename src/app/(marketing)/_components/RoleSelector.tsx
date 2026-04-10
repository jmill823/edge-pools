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
        {/* TILT wordmark */}
        <h2 className="text-center font-display text-[36px] font-[900] italic tracking-[4px] text-text-primary leading-none">
          TILT
        </h2>

        {/* Green rule */}
        <div className="mx-auto mt-3 mb-5 h-[2px] w-8 bg-[#2D5F3B]" />

        {/* 3 action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleJoin}
            className="w-full rounded-btn bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:brightness-105 active:scale-[0.98] min-h-[44px]"
          >
            <span className="block font-display text-[18px] font-bold text-white">
              JOIN
            </span>
            <span className="block font-body text-[12px] text-white/80 mt-0.5">
              Enter a pool
            </span>
          </button>

          <button
            onClick={handleCreate}
            className="w-full rounded-btn bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:brightness-105 active:scale-[0.98] min-h-[44px]"
          >
            <span className="block font-display text-[18px] font-bold text-white">
              CREATE
            </span>
            <span className="block font-body text-[12px] text-white/80 mt-0.5">
              Start a new pool
            </span>
          </button>

          <button
            onClick={handleSwitch}
            className="w-full rounded-btn bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-4 text-center cursor-pointer transition-all duration-200 hover:brightness-105 active:scale-[0.98] min-h-[44px]"
          >
            <span className="block font-display text-[18px] font-bold text-white">
              SWITCH
            </span>
            <span className="block font-body text-[12px] text-white/80 mt-0.5">
              Ditch the spreadsheet
            </span>
          </button>
        </div>

        {/* Skip link */}
        <button
          onClick={dismiss}
          className="mt-4 w-full text-center font-body text-[10px] text-text-muted hover:text-text-secondary transition-colors duration-200 cursor-pointer"
        >
          Just browsing
        </button>
      </div>
    </div>
  );
}
