"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

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

export default function JoinPoolPage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/pools/join/${params.inviteCode}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setPool(data));
  }, [params.inviteCode]);

  async function handleJoin() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/join/${params.inviteCode}`);
      return;
    }

    setJoining(true);
    setError("");

    const res = await fetch(`/api/pools/join/${params.inviteCode}`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setJoining(false);
      return;
    }

    if (data.alreadyMember) {
      router.push(`/dashboard`);
      return;
    }

    router.push(`/dashboard`);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-green-900">Pool Not Found</h1>
        <p className="mt-2 text-sm text-green-600">
          That invite code doesn&apos;t match any pool. Check the code and try again.
        </p>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-green-200 p-6">
        <h1 className="text-xl font-bold text-green-900">{pool.name}</h1>
        <p className="mt-1 text-sm text-green-600">{pool.tournamentName}</p>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="Organizer" value={pool.organizerName} />
          <Row label="Categories" value={String(pool.categoryCount)} />
          <Row label="Members" value={String(pool.memberCount)} />
          <Row
            label="Picks Due"
            value={new Date(pool.picksDeadline).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          />
        </div>

        {error && (
          <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!pool.acceptingMembers ? (
          <div className="mt-6 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This pool is no longer accepting new members.
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="mt-6 w-full rounded-md bg-green-800 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-900 disabled:opacity-50"
          >
            {joining
              ? "Joining..."
              : isSignedIn
              ? "Join Pool"
              : "Sign In to Join"}
          </button>
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
