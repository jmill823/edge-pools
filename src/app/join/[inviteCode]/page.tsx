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

  if (loading || !isLoaded) {
    return <div className="mx-auto max-w-md px-4 py-12 text-center text-green-600">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-green-900">Invalid Invite Link</h1>
        <p className="mt-2 text-sm text-green-600">This invite link is invalid. Check the code and try again.</p>
        <Link href="/join" className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900">&larr; Try Again</Link>
      </div>
    );
  }

  if (!pool) return null;

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
        <p className="text-sm text-green-600">You&apos;re invited to</p>
        <h1 className="text-2xl font-bold text-green-900 mt-1">{pool.name}</h1>
        <p className="text-sm text-green-600 mt-1">hosted by {pool.organizerName}</p>
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
              <div key={cat.name} className="shrink-0 rounded-md bg-green-50 border border-green-200 px-3 py-2 min-w-[100px]">
                <div className="text-xs font-medium text-green-900">{cat.name}</div>
                <div className="text-[10px] text-green-500 mt-0.5">{cat.golferCount} golfers</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadline callout */}
      {pool.status === "OPEN" && (
        <div className="rounded-lg bg-[#FAEEDA] border border-amber-200 px-4 py-3 mb-4">
          <p className="text-sm font-medium text-[#633806]">Picks due {deadlineStr}</p>
          {hoursLeft <= 48 && hoursLeft > 0 && (
            <p className="text-xs text-[#633806] mt-0.5">{hoursLeft} hours remaining</p>
          )}
        </div>
      )}

      {/* House rules */}
      {pool.rules && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">House Rules</p>
          <p className="text-sm text-green-800 whitespace-pre-wrap">{pool.rules}</p>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* CTA */}
      {closedReason ? (
        <div className="rounded bg-amber-50 px-3 py-3 text-sm text-amber-800">{closedReason}</div>
      ) : (
        <Button variant="primary" className="w-full" loading={joining} onClick={handleJoin}>
          {isSignedIn ? "Join This Pool" : "Sign In to Join"}
        </Button>
      )}
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  );
}
