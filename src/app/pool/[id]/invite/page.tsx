"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PoolInfo {
  id: string;
  name: string;
  inviteCode: string;
  tournament: { name: string };
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/pools/${params.id}`)
      .then((r) => r.json())
      .then(setPool);
  }, [params.id]);

  if (!pool) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-900">Pool Created!</h1>
        <p className="mt-2 text-green-600">{pool.name}</p>
      </div>

      <div className="mt-8 space-y-4">
        {/* Invite link */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
            Invite Link
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 rounded border border-green-200 bg-white px-3 py-2 text-sm text-green-900"
            />
            <button
              onClick={copyLink}
              className="shrink-0 rounded bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Invite code */}
        <div className="rounded-lg border border-green-200 p-4 text-center">
          <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
            Invite Code
          </label>
          <p className="mt-2 text-2xl font-mono font-bold text-green-900 tracking-widest">
            {pool.inviteCode}
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3">
          <a
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            className="flex-1 rounded-md border border-green-300 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Share via Text
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(
              `Join my golf pool: ${pool.name}`
            )}&body=${encodeURIComponent(shareText)}`}
            className="flex-1 rounded-md border border-green-300 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Share via Email
          </a>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Link
            href={`/pool/${pool.id}/manage`}
            className="flex-1 rounded-md bg-green-800 py-3 text-center text-sm font-semibold text-white hover:bg-green-900"
          >
            Manage Pool
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-md border border-green-300 py-3 text-center text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
