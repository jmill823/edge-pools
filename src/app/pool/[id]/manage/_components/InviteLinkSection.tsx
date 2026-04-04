"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface InviteLinkSectionProps {
  poolName: string;
  tournamentName: string;
  inviteCode: string;
  inviteUrl: string;
  status: string;
  picksDeadline?: string;
  maxEntries?: number;
  poolType?: string | null;
}

export function InviteLinkSection({ poolName, tournamentName, inviteCode, inviteUrl, status, picksDeadline, maxEntries, poolType }: InviteLinkSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — handled by input select
    }
  }, [inviteUrl]);

  // Only visible in SETUP, OPEN, LOCKED, LIVE
  const visible = ["SETUP", "OPEN", "LOCKED", "LIVE"].includes(status);
  if (!visible) return null;

  const shareText = `Join my golf pool "${poolName}" for the ${tournamentName}: ${inviteUrl}`;

  const deadlineFormatted = picksDeadline
    ? new Date(picksDeadline).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : "TBD";

  const emailSubject = `Tilt–Join the Pool: ${poolName}`;
  const emailBody = [
    `You're invited to join "${poolName}"!`,
    ``,
    `Tournament: ${tournamentName}`,
    `Deadline: ${deadlineFormatted}`,
    `Type: ${poolType || "Categories"}`,
    `Entries Allowed: ${maxEntries ?? 1}`,
    ``,
    `Join here: ${inviteUrl}`,
  ].join("\n");

  return (
    <div className="rounded-card border-2 border-accent-primary bg-surface p-4">
      <p className="font-display text-[10px] font-medium text-accent-primary uppercase tracking-[0.5px] mb-2">
        Invite Link
      </p>

      {/* Link + Copy */}
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 min-w-0 rounded-btn border border-border bg-surface px-3 py-2.5 font-mono text-sm text-text-primary truncate"
          onFocus={(e) => e.target.select()}
        />
        <Button variant="primary" className="shrink-0 min-h-[44px]" onClick={copyLink}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Invite code */}
      <p className="font-mono text-xs text-text-muted mt-2 tracking-wide">
        Code: {inviteCode}
      </p>

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <a
          href={`sms:?body=${encodeURIComponent(shareText)}`}
          className="rounded-btn border border-border bg-surface py-2.5 text-center font-body text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Text</span>
        </a>
        <button
          type="button"
          onClick={() => {
            window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
          }}
          className="rounded-btn border border-border bg-surface py-2.5 text-center font-body text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Email</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-btn border border-border bg-surface py-2.5 text-center font-body text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
