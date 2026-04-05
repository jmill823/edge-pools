"use client";

import { useEffect, useState } from "react";
import { Trophy, Flag } from "lucide-react";

const STORAGE_KEY = "tilt_role_seen";

interface RoleSelectorProps {
  onSelectCommissioner: () => void;
  onSelectPlayer: () => void;
}

export function RoleSelector({ onSelectCommissioner, onSelectPlayer }: RoleSelectorProps) {
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

  function handleCommissioner() {
    dismiss();
    onSelectCommissioner();
  }

  function handlePlayer() {
    dismiss();
    onSelectPlayer();
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
        <div className="mx-auto mt-3 mb-3 h-[2px] w-8 bg-[#2D5F3B]" />

        {/* Prompt */}
        <p className="text-center font-display text-[15px] font-semibold text-text-primary">
          I&rsquo;m here to&hellip;
        </p>

        {/* Role cards */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={handleCommissioner}
            className="flex-1 rounded-card border-[1.5px] border-[#EDEAE4] p-4 text-center cursor-pointer transition-all duration-200 hover:border-[#2D5F3B] hover:bg-[#E8F0E5]"
          >
            <Trophy className="mx-auto h-6 w-6 text-[#2D5F3B]" />
            <p className="mt-1 font-display text-[13px] font-bold text-text-primary">
              Run a pool
            </p>
            <p className="mt-1 font-body text-[10px] font-normal text-text-secondary leading-[1.4]">
              Set up categories, invite your group, manage the leaderboard
            </p>
          </button>

          <button
            onClick={handlePlayer}
            className="flex-1 rounded-card border-[1.5px] border-[#EDEAE4] p-4 text-center cursor-pointer transition-all duration-200 hover:border-[#2D5F3B] hover:bg-[#E8F0E5]"
          >
            <Flag className="mx-auto h-6 w-6 text-[#2D5F3B]" />
            <p className="mt-1 font-display text-[13px] font-bold text-text-primary">
              Join a pool
            </p>
            <p className="mt-1 font-body text-[10px] font-normal text-text-secondary leading-[1.4]">
              Pick your golfers, watch the leaderboard, talk trash
            </p>
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
