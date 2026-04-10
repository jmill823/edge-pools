"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface CategoryPreview { name: string; golferCount: number; }

interface PoolInfo {
  id: string;
  name: string;
  tournamentName: string;
  tournamentCourse: string | null;
  organizerName: string;
  categoryCount: number;
  categories: CategoryPreview[];
  memberCount: number;
  maxEntries: number;
  picksDeadline: string;
  acceptingMembers: boolean;
  status: string;
  rules: string | null;
}

export default function JoinPoolPage({ params }: { params: { inviteCode: string } }) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestJoining, setGuestJoining] = useState(false);
  const [returnVisitName, setReturnVisitName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pools/join/${params.inviteCode}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) setPool(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params.inviteCode]);

  async function handleJoin() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/join/${params.inviteCode}`);
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/pools/join/${params.inviteCode}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to join pool"); setJoining(false); return; }
      router.push(`/pool/${data.poolId}/picks`);
    } catch {
      setError("Something went wrong. Please try again.");
      setJoining(false);
    }
  }

  // Guest join flow
  async function handleGuestJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!pool) return;

    const name = guestName.trim();
    const email = guestEmail.trim().toLowerCase();

    if (!name) { setError("Please enter your name."); return; }
    if (!email || !email.includes("@")) { setError("Please enter a valid email."); return; }

    setGuestJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/pools/${pool.id}/guest/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to join"); setGuestJoining(false); return; }

      if (data.returning && data.hasEntries) {
        setReturnVisitName(data.displayName);
        setTimeout(() => {
          if (pool.status === "OPEN" && new Date(pool.picksDeadline) > new Date()) {
            router.push(`/guest-pool/${pool.id}/picks`);
          } else {
            router.push(`/guest-pool/${pool.id}/leaderboard`);
          }
        }, 1500);
        return;
      }

      router.push(`/guest-pool/${pool.id}/picks`);
    } catch {
      setError("Something went wrong. Please try again.");
      setGuestJoining(false);
    }
  }

  if (loading || !isLoaded) {
    return <div className="mx-auto max-w-md px-4 py-12 text-center font-body text-text-secondary">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">Invalid Invite Link</h1>
        <p className="mt-2 font-body text-sm text-text-secondary">This invite link is invalid. Check the code and try again.</p>
        <Link href="/join" className="mt-4 inline-block font-body text-sm font-medium text-accent-primary hover:underline">&larr; Try Again</Link>
      </div>
    );
  }

  if (!pool) return null;

  // Return visit welcome screen
  if (returnVisitName) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="text-4xl mb-4">&#x1F44B;</div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Welcome back, {returnVisitName}!</h1>
        <p className="mt-2 font-body text-sm text-text-secondary">Your picks are saved. Taking you there now...</p>
      </div>
    );
  }

  const closedReason =
    pool.status !== "OPEN" ? "This pool is not currently accepting players."
    : !pool.acceptingMembers ? "This pool is no longer accepting new members."
    : null;

  const deadline = new Date(pool.picksDeadline);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 3600000));
  const deadlineStr = deadline.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="font-body text-sm text-text-secondary">You&apos;re invited to</p>
        <h1 className="font-display text-2xl font-bold text-text-primary mt-1">{pool.name}</h1>
        <p className="font-body text-sm text-text-secondary mt-1">hosted by {pool.organizerName}</p>
      </div>

      {/* Info strip */}
      <div className="flex gap-2 overflow-x-auto mb-4">
        <InfoChip label={pool.tournamentName} />
        {pool.tournamentCourse && <InfoChip label={pool.tournamentCourse} />}
        <InfoChip label={`${pool.categoryCount} categories`} />
        <InfoChip label={`${pool.memberCount} players`} />
        {pool.maxEntries > 1 && <InfoChip label={`Up to ${pool.maxEntries} entries`} />}
      </div>

      {/* Category preview strip */}
      {pool.categories.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <div className="flex gap-2 min-w-max">
            {pool.categories.map((cat) => (
              <div key={cat.name} className="shrink-0 rounded-data bg-surface-alt border border-border px-3 py-2 min-w-[100px]">
                <div className="font-body text-xs font-medium text-text-primary">{cat.name}</div>
                <div className="font-mono text-[10px] text-text-muted mt-0.5">{cat.golferCount} golfers</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadline callout */}
      {pool.status === "OPEN" && (
        <div className="rounded-card bg-[#FDF4E3] border border-[#E2DDD5] px-4 py-3 mb-4">
          <p className="font-body text-sm font-medium text-[#8A6B1E]">Picks due {deadlineStr}</p>
          {hoursLeft <= 48 && hoursLeft > 0 && (
            <p className="font-mono text-xs text-[#8A6B1E] mt-0.5">{hoursLeft} hours remaining</p>
          )}
        </div>
      )}

      {/* House rules */}
      {pool.rules && (
        <div className="rounded-card border border-border bg-surface-alt px-4 py-3 mb-4">
          <p className="font-display text-[9px] font-medium text-text-muted uppercase tracking-[0.5px] mb-1">House Rules</p>
          <p className="font-body text-sm text-text-primary whitespace-pre-wrap">{pool.rules}</p>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* CTA section */}
      {closedReason ? (
        <div className="rounded-card bg-[#FDF4E3] px-3 py-3 font-body text-sm text-[#8A6B1E]">{closedReason}</div>
      ) : isSignedIn ? (
        /* Signed-in user (commissioner or account holder) — use Clerk flow */
        <Button variant="primary" className="w-full" loading={joining} onClick={handleJoin}>
          Join This Pool
        </Button>
      ) : (
        /* Guest join form — name + email, no account required */
        <div className="rounded-card border border-border bg-surface px-4 py-5">
          <form onSubmit={handleGuestJoin} className="space-y-3">
            <div>
              <label htmlFor="guestName" className="block font-body text-xs font-medium text-text-secondary mb-1">
                Display Name
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value.slice(0, 50))}
                placeholder="How you want to appear on the leaderboard"
                className="w-full rounded-[6px] border border-border bg-surface px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-[rgba(27,94,59,0.15)]"
                maxLength={50}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="guestEmail" className="block font-body text-xs font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-[6px] border border-border bg-surface px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-[rgba(27,94,59,0.15)]"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full !bg-gradient-to-r !from-[#2D7A4F] !to-[#3A9963]"
              loading={guestJoining}
            >
              Make My Picks &rarr;
            </Button>
          </form>
          <p className="mt-3 text-center font-body text-xs text-text-muted">
            No account needed. Just pick and play.
          </p>

          {/* Link for commissioners who want to sign in */}
          <div className="mt-4 pt-3 border-t border-border text-center">
            <button
              type="button"
              onClick={() => router.push(`/sign-in?redirect_url=/join/${params.inviteCode}`)}
              className="font-body text-xs text-text-secondary hover:text-accent-primary transition-colors duration-200 cursor-pointer"
            >
              Commissioner? Sign in instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-data bg-surface-alt px-3 py-1.5 font-body text-xs font-medium text-text-secondary">
      {label}
    </span>
  );
}
