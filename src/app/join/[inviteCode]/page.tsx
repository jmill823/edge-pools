"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pools/join/${params.inviteCode}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setPool(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [params.inviteCode]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-green-600">
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-green-900">Pool Not Found</h1>
        <p className="mt-2 text-sm text-green-600">
          That invite code doesn&apos;t match any pool. Check the code and try again.
        </p>
        <Link href="/join" className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-900">
          &larr; Try Again
        </Link>
      </div>
    );
  }

  if (!pool) return null;

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

        {!pool.acceptingMembers ? (
          <div className="mt-6 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This pool is no longer accepting new members.
          </div>
        ) : (
          <div className="mt-6">
            <Button variant="primary" className="w-full" disabled>
              Join Pool — Coming in Next Update
            </Button>
            <p className="mt-2 text-xs text-center text-green-500">
              Full join flow will be available in the next update.
            </p>
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
