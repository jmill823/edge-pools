"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Member {
  id: string;
  displayName: string;
  email: string;
  role: string;
  hasPaid: boolean;
  joinedAt: string;
  entriesSubmitted: number;
}

interface PoolData {
  id: string;
  name: string;
  inviteCode: string;
  status: string;
  acceptingMembers: boolean;
  picksDeadline: string;
  maxEntries: number;
  rules: string | null;
  memberCount: number;
  entryCount: number;
  isOrganizer: boolean;
  tournament: { name: string; startDate: string };
}

export default function ManagePoolPage({
  params,
}: {
  params: { id: string };
}) {
  const [pool, setPool] = useState<PoolData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);

  const loadPool = useCallback(() => {
    fetch(`/api/pools/${params.id}`)
      .then((r) => r.json())
      .then(setPool);
  }, [params.id]);

  const loadMembers = useCallback(() => {
    fetch(`/api/pools/${params.id}/members`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      });
  }, [params.id]);

  useEffect(() => {
    loadPool();
    loadMembers();
  }, [loadPool, loadMembers]);

  async function togglePaid(memberId: string, hasPaid: boolean) {
    await fetch(`/api/pools/${params.id}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasPaid }),
    });
    loadMembers();
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/pools/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadPool();
  }

  async function toggleAccepting(accepting: boolean) {
    await fetch(`/api/pools/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptingMembers: accepting }),
    });
    loadPool();
  }

  function copyLink() {
    if (!pool) return;
    const url = `${window.location.origin}/join/${pool.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (!pool.isOrganizer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-green-900">Access Denied</h1>
        <p className="mt-2 text-sm text-green-600">
          Only the pool organizer can access this page.
        </p>
      </div>
    );
  }

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${pool.inviteCode}`
      : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">{pool.name}</h1>
          <p className="mt-1 text-sm text-green-600">{pool.tournament.name}</p>
        </div>
        <StatusBadge status={pool.status} />
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Members" value={pool.memberCount} />
        <Stat label="Entries" value={pool.entryCount} />
        <Stat label="Max Entries" value={pool.maxEntries} />
        <Stat
          label="Picks Due"
          value={new Date(pool.picksDeadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        />
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap gap-3">
        {pool.status === "SETUP" && (
          <button
            onClick={() => updateStatus("OPEN")}
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Open Pool
          </button>
        )}
        {pool.status === "OPEN" && (
          <button
            onClick={() => updateStatus("LOCKED")}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Lock Picks
          </button>
        )}
        <button
          onClick={() => toggleAccepting(!pool.acceptingMembers)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            pool.acceptingMembers
              ? "border-red-300 text-red-700 hover:bg-red-50"
              : "border-green-300 text-green-700 hover:bg-green-50"
          }`}
        >
          {pool.acceptingMembers ? "Close to New Members" : "Reopen to Members"}
        </button>
      </div>

      {/* Invite section */}
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4">
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
        <div className="mt-3 flex gap-2">
          <a
            href={`sms:?body=${encodeURIComponent(
              `Join my golf pool: ${inviteUrl}`
            )}`}
            className="rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            Text
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(
              `Join ${pool.name}`
            )}&body=${encodeURIComponent(
              `Join my golf pool: ${inviteUrl}`
            )}`}
            className="rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            Email
          </a>
        </div>
      </div>

      {/* Members table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-green-900">
          Members ({members.length})
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-200 text-left text-xs text-green-600 uppercase tracking-wide">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4 hidden sm:table-cell">Email</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Entries</th>
                <th className="pb-2">Paid</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-green-100 text-green-900"
                >
                  <td className="py-2 pr-4 font-medium">{m.displayName}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell text-green-600">
                    {m.email}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        m.role === "ORGANIZER"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{m.entriesSubmitted}</td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={m.hasPaid}
                      onChange={(e) => togglePaid(m.id, e.target.checked)}
                      className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules */}
      {pool.rules && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-green-900">House Rules</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-green-700">
            {pool.rules}
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 pt-4 border-t border-green-200">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SETUP: "bg-gray-100 text-gray-700",
    OPEN: "bg-green-100 text-green-800",
    LOCKED: "bg-amber-100 text-amber-800",
    LIVE: "bg-red-100 text-red-800",
    COMPLETE: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-green-200 p-3 text-center">
      <div className="text-xl font-bold text-green-900">{value}</div>
      <div className="text-xs text-green-600">{label}</div>
    </div>
  );
}
