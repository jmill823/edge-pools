"use client";

import { useState, useCallback } from "react";

interface InviteShareRowProps {
  inviteUrl: string;
  poolName: string;
  tournamentName: string;
  status: string;
}

export function InviteShareRow({ inviteUrl, poolName, tournamentName, status }: InviteShareRowProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl]);

  const handleShare = useCallback(async () => {
    const shareText = `Join my golf pool "${poolName}" for the ${tournamentName}: ${inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: poolName, text: shareText, url: inviteUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Last resort
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl, poolName, tournamentName]);

  // Hidden in COMPLETE + ARCHIVED
  const visible = ["SETUP", "OPEN", "LOCKED", "LIVE"].includes(status);
  if (!visible) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={copyLink}
        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] px-3 font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px]"
      >
        <svg className="h-3.5 w-3.5 text-[#6B6560] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {copied ? "Copied!" : "Copy invite link"}
      </button>
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] px-3 font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px]"
      >
        <svg className="h-3.5 w-3.5 text-[#6B6560] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    </div>
  );
}
