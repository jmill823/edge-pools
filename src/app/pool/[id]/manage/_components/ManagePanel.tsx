"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface PoolData {
  id: string;
  name: string;
  status: string;
  acceptingMembers: boolean;
  inviteCode: string;
  maxEntries: number;
  picksDeadline: string;
  rules: string | null;
  tournament: { name: string; startDate: string; endDate: string; course: string | null };
  memberCount: number;
  entryCount: number;
}

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  hasPaid: boolean;
  joinedAt: string;
  entriesSubmitted: number;
}

const NEXT_STATUS: Record<string, { target: string; label: string; variant: "primary" | "destructive" | "secondary" }> = {
  SETUP: { target: "OPEN", label: "Open Pool for Entries", variant: "primary" },
  OPEN: { target: "LOCKED", label: "Lock Picks", variant: "secondary" },
  LOCKED: { target: "LIVE", label: "Go Live", variant: "primary" },
  LIVE: { target: "COMPLETE", label: "Mark Complete", variant: "secondary" },
  COMPLETE: { target: "ARCHIVED", label: "Archive Pool", variant: "secondary" },
};

interface ManagePanelProps {
  pool: PoolData;
  members: MemberData[];
  inviteUrl: string;
}

export function ManagePanel({ pool: initialPool, members: initialMembers, inviteUrl }: ManagePanelProps) {
  const router = useRouter();
  const [pool, setPool] = useState(initialPool);
  const [members, setMembers] = useState(initialMembers);
  const [copied, setCopied] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const copyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [inviteUrl]);

  const transitionStatus = useCallback(async () => {
    const next = NEXT_STATUS[pool.status];
    if (!next) return;

    setStatusLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pools/${pool.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.target }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      const updated = await res.json();
      setPool((p) => ({ ...p, status: updated.status }));
      setFeedback({ type: "success", message: `Pool is now ${updated.status}` });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setStatusLoading(false);
    }
  }, [pool.id, pool.status, router]);

  const toggleAccepting = useCallback(async () => {
    setToggleLoading(true);
    try {
      const res = await fetch(`/api/pools/${pool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptingMembers: !pool.acceptingMembers }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setPool((p) => ({ ...p, acceptingMembers: updated.acceptingMembers }));
    } catch {
      setFeedback({ type: "error", message: "Failed to toggle accepting members" });
    } finally {
      setToggleLoading(false);
    }
  }, [pool.id, pool.acceptingMembers]);

  const togglePaid = useCallback(async (memberId: string, currentPaid: boolean) => {
    try {
      const res = await fetch(`/api/pools/${pool.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid: !currentPaid }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, hasPaid: !currentPaid } : m))
      );
    } catch {
      setFeedback({ type: "error", message: "Failed to update payment status" });
    }
  }, [pool.id]);

  const paidCount = members.filter((m) => m.hasPaid).length;
  const nextStatus = NEXT_STATUS[pool.status];
  const deadline = new Date(pool.picksDeadline);

  return (
    <div className="mx-auto max-w-content px-4 py-6 space-y-5">
      {/* Pool Info Header */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-subtle">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-text-primary truncate">{pool.name}</h1>
            <p className="font-body text-sm text-text-secondary mt-0.5">{pool.tournament.name}</p>
            {pool.tournament.course && (
              <p className="font-body text-xs text-text-muted mt-0.5">{pool.tournament.course}</p>
            )}
          </div>
          <StatusBadge status={pool.status} />
        </div>

        {/* Counts strip */}
        <div className="mt-4 flex gap-3 overflow-x-auto -mx-1 px-1">
          <CountChip label="Members" value={pool.memberCount} />
          <CountChip label="Entries" value={pool.entryCount} />
          <CountChip label="Max/player" value={pool.maxEntries} />
          <CountChip label="Paid" value={`${paidCount}/${members.length}`} />
        </div>

        <p className="font-mono text-xs text-text-muted mt-3">
          Picks deadline: {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {" at "}
          {deadline.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}

      {/* Invite Link */}
      <div className="rounded-card border-2 border-accent-primary bg-surface p-4">
        <p className="font-display text-[9px] font-medium text-accent-primary uppercase tracking-[0.5px] mb-2">Invite Link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 min-w-0 rounded-btn border border-border bg-surface px-3 py-2.5 font-mono text-sm text-text-primary truncate"
            onFocus={(e) => e.target.select()}
          />
          <Button
            variant="primary"
            className="shrink-0 min-h-[44px]"
            onClick={copyInviteLink}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="font-mono text-xs text-text-muted mt-2 tracking-wide">
          Code: {pool.inviteCode}
        </p>
      </div>

      {/* Accepting Members Toggle */}
      <div className="rounded-card border border-border bg-surface p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-sm font-medium text-text-primary">Accepting new members</p>
          <p className="font-body text-xs text-text-muted mt-0.5">
            {pool.acceptingMembers ? "Anyone with the invite link can join" : "New joins are blocked"}
          </p>
        </div>
        <button
          onClick={toggleAccepting}
          disabled={toggleLoading}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 min-w-[48px] cursor-pointer ${
            pool.acceptingMembers ? "bg-accent-success" : "bg-text-muted"
          }`}
          role="switch"
          aria-checked={pool.acceptingMembers}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              pool.acceptingMembers ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Member List */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-alt">
          <p className="font-display text-sm font-semibold text-text-primary">
            Members ({members.length})
          </p>
        </div>
        {members.length === 0 ? (
          <p className="px-4 py-8 text-center font-body text-sm text-text-muted">No members yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                {/* Paid checkbox */}
                <button
                  onClick={() => togglePaid(m.id, m.hasPaid)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors duration-200 cursor-pointer ${
                    m.hasPaid
                      ? "border-accent-success bg-accent-success text-white"
                      : "border-border bg-surface hover:border-text-muted"
                  }`}
                  aria-label={`Mark ${m.displayName} as ${m.hasPaid ? "unpaid" : "paid"}`}
                  title={m.hasPaid ? "Paid — tap to unmark" : "Not paid — tap to mark paid"}
                >
                  {m.hasPaid && (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-text-primary truncate">{m.displayName}</span>
                    {m.role === "ORGANIZER" && (
                      <span className="font-body text-[10px] font-medium text-accent-secondary bg-[#FDF4E3] rounded-data px-1.5 py-0.5">
                        Host
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-text-muted truncate">
                    {m.entriesSubmitted > 0
                      ? `${m.entriesSubmitted} ${m.entriesSubmitted === 1 ? "entry" : "entries"}`
                      : "No entries yet"}
                  </p>
                </div>

                {/* Paid label */}
                <span className={`font-body text-xs font-medium shrink-0 ${m.hasPaid ? "text-accent-success" : "text-text-muted"}`}>
                  {m.hasPaid ? "Paid" : "Unpaid"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status Transition */}
      {nextStatus && (
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-body text-xs text-text-muted mb-3">
            Current status: <span className="font-medium">{pool.status}</span> → Next: <span className="font-medium">{nextStatus.target}</span>
          </p>
          <Button
            variant={nextStatus.variant}
            loading={statusLoading}
            onClick={transitionStatus}
            className="w-full"
          >
            {nextStatus.label}
          </Button>
        </div>
      )}

      {/* House Rules (if set) */}
      {pool.rules && (
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px] mb-1">House Rules</p>
          <p className="font-body text-sm text-text-primary whitespace-pre-wrap">{pool.rules}</p>
        </div>
      )}
    </div>
  );
}

function CountChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="shrink-0 rounded-card bg-surface-alt border border-border px-3 py-2 text-center min-w-[72px]">
      <p className="font-mono text-base font-bold text-text-primary">{value}</p>
      <p className="font-body text-[10px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
