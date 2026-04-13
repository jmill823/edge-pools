"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { EmailInviteSection } from "./_components/EmailInviteSection";

interface PoolInfo {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  picksDeadline: string | null;
  maxEntries: number;
  rules: string | null;
  memberCount: number;
  tournament: { name: string; startDate: string; endDate: string };
}

interface RecentMember {
  displayName: string;
  joinedAt: string;
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch(`/api/pools/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPool(data);
        // Fetch recent members
        fetch(`/api/pools/${params.id}/members`)
          .then((r) => r.json())
          .then((members) => {
            if (Array.isArray(members)) {
              const sorted = members
                .sort((a: { joinedAt: string }, b: { joinedAt: string }) =>
                  new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
                )
                .slice(0, 5);
              setRecentMembers(sorted);
            }
          })
          .catch(() => {});
      });
  }, [params.id]);

  if (!pool) return null;

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${pool.inviteCode}`
      : `/join/${pool.inviteCode}`;

  const shareText = `Join my golf pool "${pool.name}" for the ${pool.tournament.name}: ${inviteUrl}`;

  const deadlineFormatted = pool.picksDeadline
    ? new Date(pool.picksDeadline).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : "TBD";

  const emailSubject = `Tilt–Join the Pool: ${pool.name}`;
  const emailBody = [
    `You're invited to join "${pool.name}"!`,
    ``,
    `Tournament: ${pool.tournament.name}`,
    `Deadline: ${deadlineFormatted}`,
    `Entries Allowed: ${pool.maxEntries}`,
    ``,
    `Join here: ${inviteUrl}`,
  ].join("\n");

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleEmail() {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    setTimeout(() => {
      navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`).then(() => {
        setFeedback({ type: "success", msg: "Email content copied — paste into your email client" });
      }).catch(() => {});
    }, 1000);
  }

  async function openPool() {
    if (!confirm("Open this pool? Players will be able to join and make picks.")) return;
    setOpening(true);
    try {
      const res = await fetch(`/api/pools/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: "error", msg: data.error || "Failed to open pool" });
      } else {
        setFeedback({ type: "success", msg: "Pool is now open! Players can join." });
        setPool((p) => p ? { ...p, status: "OPEN" } : p);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to open pool" });
    }
    setOpening(false);
  }

  return (
    <div className="mx-auto max-w-content px-4 py-4 space-y-3">
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.msg} onDismiss={() => setFeedback(null)} />
      )}

      {/* A. Pool Info Card */}
      <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-sans text-[14px] font-medium text-[#1A1A18] truncate">{pool.name}</p>
          <StatusBadge status={pool.status} />
        </div>
        <p className="font-sans text-[10px] text-[#A39E96]">{pool.tournament.name}</p>
        <p className="font-mono text-[11px] text-[#A39E96] mt-1">{pool.memberCount} members</p>
      </div>

      {/* B. Invite Link Card (prominent) */}
      <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-3">
        <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-2">
          INVITE LINK
        </p>
        <div className="flex items-center gap-2">
          <p className="flex-1 font-mono text-[11px] text-[#1A1A18] truncate min-w-0">
            {inviteUrl}
          </p>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[11px] font-medium px-3 py-2 hover:bg-[#246840] transition-colors duration-200 cursor-pointer min-h-[36px]"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* C. Share Buttons Row */}
      <div className="flex gap-2">
        {/* Text — mobile only */}
        <a
          href={`sms:?body=${encodeURIComponent(shareText)}`}
          className="flex-1 flex items-center justify-center gap-1 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px] md:hidden"
        >
          <svg className="h-3.5 w-3.5 text-[#6B6560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Text
        </a>
        {/* Email */}
        <button
          type="button"
          onClick={handleEmail}
          className="flex-1 flex items-center justify-center gap-1 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px]"
        >
          <svg className="h-3.5 w-3.5 text-[#6B6560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </button>
        {/* Copy */}
        <button
          type="button"
          onClick={copyInviteLink}
          className="flex-1 flex items-center justify-center gap-1 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px]"
        >
          <svg className="h-3.5 w-3.5 text-[#6B6560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {linkCopied ? "Copied!" : "Copy"}
        </button>
        {/* WhatsApp — mobile only */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 bg-white border border-[#E2DDD5] rounded-[4px] py-[7px] font-sans text-[10px] font-medium text-[#1A1A18] hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[36px] md:hidden"
        >
          <svg className="h-3.5 w-3.5 text-[#6B6560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          WhatsApp
        </a>
      </div>

      {/* D. Recently Joined Mini-Grid */}
      <div className="border border-[#E2DDD5] rounded-[6px] overflow-hidden">
        <div className="bg-[#B09A60] px-3 py-2">
          <span className="font-sans text-[10px] font-semibold text-white uppercase tracking-[0.5px]">
            RECENTLY JOINED
          </span>
        </div>
        {recentMembers.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="font-sans text-[11px] text-[#A39E96]">
              Share your invite link to get started
            </p>
          </div>
        ) : (
          recentMembers.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-[#E2DDD5] last:border-b-0 bg-white">
              <span className="font-sans text-[12px] text-[#1A1A18] truncate">{m.displayName}</span>
              <span className="font-sans text-[10px] text-[#A39E96] shrink-0 ml-2">
                {relativeTime(m.joinedAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* E. Email Invite Section */}
      <EmailInviteSection poolId={pool.id} />

      {/* Open Pool — only in SETUP */}
      {pool.status === "SETUP" && (
        <button
          onClick={openPool}
          disabled={opening}
          className="w-full rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          {opening ? "Opening..." : "Open Pool for Players"}
        </button>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Link href="/dashboard" className="flex-1">
          <button className="w-full rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[11px] font-medium py-2.5 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[44px]">
            Dashboard
          </button>
        </Link>
        <Link href={`/pool/${pool.id}/manage`} className="flex-1">
          <button className="w-full rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[11px] font-medium py-2.5 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[44px]">
            Manage Pool
          </button>
        </Link>
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
