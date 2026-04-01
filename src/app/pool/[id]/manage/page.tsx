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
  tournament: { id: string; name: string; startDate: string; lastSyncAt: string | null };
  pendingReplacements: number;
}

export default function ManagePoolPage({
  params,
}: {
  params: { id: string };
}) {
  const [pool, setPool] = useState<PoolData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [polling, setPolling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editMaxEntries, setEditMaxEntries] = useState(1);
  const [editRules, setEditRules] = useState("");

  const loadPool = useCallback(() => {
    fetch(`/api/pools/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPool(data);
        // Sync edit form state
        setEditName(data.name || "");
        setEditDeadline(
          data.picksDeadline
            ? toLocalDatetime(data.picksDeadline)
            : ""
        );
        setEditMaxEntries(data.maxEntries || 1);
        setEditRules(data.rules || "");
      });
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

  function showSuccess(msg: string) {
    setActionError(null);
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  }

  async function togglePaid(memberId: string, hasPaid: boolean) {
    setActionError(null);
    try {
      const res = await fetch(`/api/pools/${params.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update payment status");
        return;
      }
      loadMembers();
    } catch {
      setActionError("Failed to update payment status");
    }
  }

  async function updateStatus(newStatus: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/pools/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update status");
        return;
      }
      showSuccess(`Pool status changed to ${newStatus}`);
      loadPool();
    } catch {
      setActionError("Failed to update status");
    }
  }

  async function toggleAccepting(accepting: boolean) {
    setActionError(null);
    try {
      const res = await fetch(`/api/pools/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptingMembers: accepting }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update");
        return;
      }
      showSuccess(accepting ? "Now accepting members" : "Closed to new members");
      loadPool();
    } catch {
      setActionError("Failed to update");
    }
  }

  async function saveSettings() {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/pools/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          picksDeadline: new Date(editDeadline).toISOString(),
          maxEntries: editMaxEntries,
          rules: editRules.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to save settings");
        setSaving(false);
        return;
      }
      showSuccess("Settings saved");
      setEditing(false);
      loadPool();
    } catch {
      setActionError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (!pool) return;
    setEditName(pool.name);
    setEditDeadline(toLocalDatetime(pool.picksDeadline));
    setEditMaxEntries(pool.maxEntries);
    setEditRules(pool.rules || "");
    setEditing(false);
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

  const isSetup = pool.status === "SETUP";
  const isLiveOrLocked = pool.status === "LIVE" || pool.status === "LOCKED";

  async function triggerPollScores() {
    setPolling(true);
    setActionError(null);
    try {
      const res = await fetch("/api/cron/poll-scores", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "edge-pools-cron-secret-2026"}` },
      });
      if (res.ok) {
        showSuccess("Scores polled successfully");
      } else {
        setActionError("Score polling failed — try again later");
      }
    } catch {
      setActionError("Score polling failed — check connection");
    }
    setPolling(false);
    loadPool();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Replacement alert */}
      {pool.pendingReplacements > 0 && (
        <Link
          href={`/pool/${pool.id}/manage/replacements`}
          className="mb-4 block rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          ⚠️ {pool.pendingReplacements} replacement(s) need confirmation →
        </Link>
      )}

      {/* Action feedback */}
      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium">
          {actionSuccess}
        </div>
      )}

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
        {isSetup && (
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
        {pool.status === "LOCKED" && (
          <button
            onClick={() => updateStatus("LIVE")}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Go Live
          </button>
        )}
        {pool.status === "LIVE" && (
          <button
            onClick={() => updateStatus("COMPLETE")}
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Complete Tournament
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

      {/* Edit Settings — SETUP only */}
      {isSetup && (
        <div className="mt-8 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">
              Pool Settings
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
              >
                Edit Settings
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Pool Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Picks Deadline
                </label>
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="mt-1 w-full rounded border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Max Entries Per Player
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editMaxEntries}
                  onChange={(e) =>
                    setEditMaxEntries(
                      Math.max(1, Math.min(5, Number(e.target.value)))
                    )
                  }
                  className="mt-1 w-24 rounded border border-green-200 px-3 py-2 text-sm text-green-900 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide">
                  House Rules
                </label>
                <textarea
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  rows={3}
                  placeholder="Optional rules, prize info, etc."
                  className="mt-1 w-full rounded border border-green-200 px-3 py-2 text-sm text-green-900 placeholder:text-green-400 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveSettings}
                  disabled={saving || !editName.trim()}
                  className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-green-500">Pool Name</dt>
                <dd className="font-medium text-green-900">{pool.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-green-500">Picks Deadline</dt>
                <dd className="font-medium text-green-900">
                  {new Date(pool.picksDeadline).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-green-500">Max Entries</dt>
                <dd className="font-medium text-green-900">
                  {pool.maxEntries}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-green-500">House Rules</dt>
                <dd className="font-medium text-green-900">
                  {pool.rules || "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {/* Edit Categories link — SETUP only */}
      {isSetup && (
        <div className="mt-4">
          <Link
            href={`/pool/${pool.id}/categories`}
            className="inline-flex items-center gap-2 rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Categories &amp; Golfers
          </Link>
        </div>
      )}

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

      {/* View Entries + Leaderboard links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/pool/${pool.id}/manage/entries`}
          className="inline-flex items-center gap-2 rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
        >
          View All Entries
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            {pool.entryCount}
          </span>
        </Link>
        <Link
          href={`/pool/${pool.id}/leaderboard`}
          className="inline-flex items-center gap-2 rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
        >
          View Leaderboard
        </Link>
      </div>

      {/* Rules (read-only display when not in SETUP) */}
      {!isSetup && pool.rules && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-green-900">House Rules</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-green-700">
            {pool.rules}
          </p>
        </div>
      )}

      {/* Leaderboard + Scoring — LIVE/LOCKED pools */}
      {isLiveOrLocked && (
        <div className="mt-8 rounded-lg border border-green-200 p-4">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            Live Scoring
          </h2>
          {pool.tournament.lastSyncAt && (
            <p className="text-xs text-green-500 mb-3">
              Last synced:{" "}
              {new Date(pool.tournament.lastSyncAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/pool/${pool.id}/leaderboard`}
              className="rounded bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
            >
              View Leaderboard
            </Link>
            <button
              onClick={triggerPollScores}
              disabled={polling}
              className="rounded border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              {polling ? "Polling..." : "Poll Scores Now"}
            </button>
            <Link
              href={`/pool/${pool.id}/manage/replacements`}
              className="rounded border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Replacements
              {pool.pendingReplacements > 0 && (
                <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-xs text-amber-800">
                  {pool.pendingReplacements}
                </span>
              )}
            </Link>
            <Link
              href={`/admin/scores/${pool.tournament.id}`}
              className="rounded border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Manual Scores
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 pt-4 border-t border-green-200 flex gap-4">
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

/** Convert ISO string to datetime-local input value */
function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
