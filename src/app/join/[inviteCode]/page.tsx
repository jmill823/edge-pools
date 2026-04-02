"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface PoolInfo {
  id: string;
  name: string;
  tournamentName: string;
  organizerName: string;
  categoryCount: number;
  memberCount: number;
  picksDeadline: string;
  acceptingMembers: boolean;
  status: string;
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

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-green-200 p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-green-900">{pool.name}</h1>
            <p className="mt-1 text-sm text-green-600">{pool.tournamentName}</p>
          </div>
          <StatusBadge status={pool.status} />
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="Organizer" value={pool.organizerName} />
          <Row label="Categories" value={String(pool.categoryCount)} />
          <Row label="Members" value={String(pool.memberCount)} />
          <Row label="Picks Due" value={new Date(pool.picksDeadline).toLocaleDateString("en-US", {
            weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          })} />
        </div>

        {error && (
          <div className="mt-4">
            <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {closedReason ? (
          <div className="mt-6 rounded bg-amber-50 px-3 py-3 text-sm text-amber-800">{closedReason}</div>
        ) : (
          <div className="mt-6">
            <Button variant="primary" className="w-full" loading={joining} onClick={handleJoin}>
              {isSignedIn ? "Join Pool" : "Sign In to Join"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-green-600">{label}</span>
      <span className="font-medium text-green-900">{value}</span>
    </div>
  );
}
