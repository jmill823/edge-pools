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
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-900">Pool Created!</h1>
        <p className="mt-2 text-green-600">{pool.name}</p>
      </div>

      {feedback && (
        <div className="mt-4">
          <InlineFeedback type={feedback.type} message={feedback.msg} onDismiss={() => setFeedback(null)} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {/* Invite link card */}
        <div className="rounded-lg border-2 border-blue-300 bg-[#E6F1FB] p-5 text-center">
          <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Invite Link
          </label>
          <p className="mt-2 text-sm text-blue-900 break-all font-mono">{inviteUrl}</p>
          <Button variant="primary" className="mt-3" onClick={copyLink}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            className="rounded-lg border border-green-200 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50 min-h-[44px] flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">💬</span>
            <span>Text</span>
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Join my golf pool: ${pool.name}`)}&body=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-green-200 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50 min-h-[44px] flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">📧</span>
            <span>Email</span>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-green-200 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50 min-h-[44px] flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">📱</span>
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Invite code fallback */}
        <div className="rounded-lg border border-green-200 p-4 text-center">
          <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
            Invite Code
          </label>
          <p className="mt-2 text-3xl font-mono font-bold text-green-900 tracking-[0.3em]">
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
