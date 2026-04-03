"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface PoolInfo {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  tournament: { name: string };
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch(`/api/pools/${params.id}`)
      .then((r) => r.json())
      .then(setPool);
  }, [params.id]);

  if (!pool) return null; // loading.tsx handles this

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${pool.inviteCode}`
      : `/join/${pool.inviteCode}`;

  const shareText = `Join my golf pool "${pool.name}" for the ${pool.tournament.name}: ${inviteUrl}`;

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        setFeedback({ type: "success", msg: "Pool is now open! Players can join and make picks." });
        setPool((p) => p ? { ...p, status: "OPEN" } : p);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to open pool" });
    }
    setOpening(false);
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F3ED]">
          <svg className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Pool Created!</h1>
        <p className="mt-2 font-body text-text-secondary">{pool.name}</p>
      </div>

      {feedback && (
        <div className="mt-4">
          <InlineFeedback type={feedback.type} message={feedback.msg} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {/* Invite link card */}
        <div className="rounded-card border-2 border-accent-info bg-surface p-5 text-center">
          <label className="block font-display text-[9px] font-medium text-accent-info uppercase tracking-[0.5px]">
            Invite Link
          </label>
          <p className="mt-2 font-mono text-sm text-text-primary break-all">{inviteUrl}</p>
          <Button variant="primary" className="mt-3" onClick={copyLink}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            className="rounded-card border border-border bg-surface py-3 text-center font-body text-sm font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Text</span>
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Join my golf pool: ${pool.name}`)}&body=${encodeURIComponent(shareText)}`}
            onClick={(e) => {
              // Ensure mailto fires on all platforms — prevent any SPA interception
              e.stopPropagation();
              window.location.href = `mailto:?subject=${encodeURIComponent(`Join my golf pool: ${pool.name}`)}&body=${encodeURIComponent(shareText)}`;
            }}
            className="rounded-card border border-border bg-surface py-3 text-center font-body text-sm font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email</span>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-card border border-border bg-surface py-3 text-center font-body text-sm font-medium text-text-primary hover:bg-surface-alt transition-colors duration-200 min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Invite code fallback */}
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <label className="block font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px]">
            Invite Code
          </label>
          <p className="mt-2 font-mono text-3xl font-bold text-text-primary tracking-[0.3em]">
            {pool.inviteCode}
          </p>
        </div>

        {/* Open Pool — only in SETUP */}
        {pool.status === "SETUP" && (
          <Button variant="primary" className="w-full" loading={opening} onClick={openPool}>
            Open Pool for Players
          </Button>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard" className="flex-1">
            <Button variant="secondary" className="w-full">Dashboard</Button>
          </Link>
          <Link href={`/pool/${pool.id}/manage`} className="flex-1">
            <Button variant="secondary" className="w-full">Manage Pool</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
