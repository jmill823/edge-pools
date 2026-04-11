"use client";

import { useState } from "react";
import { Button } from "./Button";

interface ShareModalProps {
  poolName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareModal({ poolName, inviteCode, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-t-card sm:rounded-card border border-border shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 mx-4 mb-0 sm:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans text-base font-bold text-text-primary">
            Invite a friend to {poolName}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors duration-150 cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite link */}
        <div className="rounded-[6px] border border-border bg-surface-alt px-3 py-2.5 mb-3">
          <p className="font-mono text-xs text-text-primary break-all">{inviteUrl}</p>
        </div>

        <Button variant="primary" className="w-full mb-4" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </Button>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`sms:?body=${encodeURIComponent(`Join my golf pool on TILT: ${inviteUrl}`)}`}
            className="rounded-[6px] border border-border bg-surface py-2.5 text-center font-sans text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Text
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Join my golf pool`)}&body=${encodeURIComponent(`Join my pool "${poolName}" on TILT: ${inviteUrl}`)}`}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:?subject=${encodeURIComponent(`Join my golf pool`)}&body=${encodeURIComponent(`Join my pool "${poolName}" on TILT: ${inviteUrl}`)}`;
            }}
            className="rounded-[6px] border border-border bg-surface py-2.5 text-center font-sans text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join my golf pool on TILT: ${inviteUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[6px] border border-border bg-surface py-2.5 text-center font-sans text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
