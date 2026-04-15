"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PoolCard, PoolItem } from "./_components/PoolCard";
import { CreatePoolForm } from "./_components/CreatePoolForm";

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0, OPEN: 1, LOCKED: 2, SETUP: 3, COMPLETE: 4, ARCHIVED: 5,
};

export default function DashboardPage() {
  const router = useRouter();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a: PoolItem, b: PoolItem) => {
          const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          if (orderDiff !== 0) return orderDiff;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setPools(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const commissionerPools = pools.filter((p) => p.isOrganizer && p.status !== "ARCHIVED");
  const playerPools = pools.filter((p) => !p.isOrganizer && p.status !== "ARCHIVED");
  const archivedPools = pools.filter((p) => p.status === "ARCHIVED");
  const hasAnyPools = pools.length > 0;

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) router.push(`/join/${joinCode.trim()}`);
  }

  if (loading) return null;

  // D-6: Empty state (no pools at all)
  if (!hasAnyPools) {
    return (
      <div className="mx-auto max-w-content px-4 py-8" style={{ background: "#FAFAFA" }}>
        <div className="bg-white border-[0.5px] border-[#E2DDD5] rounded-[8px] p-6 text-center mt-8">
          <h2 className="font-sans text-[16px] font-semibold text-[#1A1A18]">Create your first pool</h2>
          <p className="font-sans text-[13px] text-[#6B6560] mt-2">Set up a golf pool in under 3 minutes</p>
          <Link href="/create">
            <button
              className="w-full mt-5 rounded-[8px] text-white font-sans text-[15px] font-semibold py-[14px] min-h-[48px] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #B09A60, #9E8A52)" }}
            >
              Create a pool
            </button>
          </Link>
          <button
            onClick={() => setShowJoin(true)}
            className="mt-2 font-sans text-[12px] font-medium text-[#B09A60] cursor-pointer hover:underline"
          >
            or Join a pool
          </button>
          {/* D-7: Inline join */}
          {showJoin && (
            <form onSubmit={handleJoin} className="flex gap-2 mt-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter invite code"
                maxLength={8}
                autoFocus
                className="flex-1 rounded-[8px] border-[0.5px] border-[#E2DDD5] bg-white px-4 py-3 font-sans text-[14px] text-center focus:border-[#B09A60] focus:outline-none focus:ring-2 focus:ring-[#B09A60]/15 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="font-sans text-[13px] font-medium text-[#B09A60] px-4 py-3 cursor-pointer disabled:opacity-40 min-h-[44px]"
              >
                Go
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-6 space-y-6 pb-8" style={{ background: "#FAFAFA" }}>
      {/* D-4: "My pools" section with inline actions */}
      {commissionerPools.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-sans text-[14px] font-semibold text-[#1A1A18]">My pools</h2>
            <div className="flex items-center gap-3">
              <Link href="/create" className="font-sans text-[12px] font-medium text-[#B09A60] hover:underline">
                + Create
              </Link>
              <button
                onClick={() => setShowJoin(!showJoin)}
                className="font-sans text-[12px] font-medium text-[#6B6560] hover:underline cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
          {/* D-7: Inline join */}
          {showJoin && (
            <form onSubmit={handleJoin} className="flex gap-2 mb-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter invite code"
                maxLength={8}
                autoFocus
                className="flex-1 rounded-[8px] border-[0.5px] border-[#E2DDD5] bg-white px-4 py-3 font-sans text-[14px] text-center focus:border-[#B09A60] focus:outline-none focus:ring-2 focus:ring-[#B09A60]/15 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="font-sans text-[13px] font-medium text-[#B09A60] px-4 py-3 cursor-pointer disabled:opacity-40 min-h-[44px]"
              >
                Go
              </button>
            </form>
          )}
          <div className="grid grid-cols-2 gap-2">
            {commissionerPools.map((p) => <PoolCard key={p.id} pool={p} variant="commissioner" />)}
          </div>
        </section>
      )}

      {/* "Pools I'm in" section — no actions on right */}
      {playerPools.length > 0 && (
        <section>
          <h2 className="font-sans text-[14px] font-semibold text-[#1A1A18] mb-2">Pools I&apos;m in</h2>
          <div className="grid grid-cols-2 gap-2">
            {playerPools.map((p) => <PoolCard key={p.id} pool={p} variant="player" />)}
          </div>
        </section>
      )}

      {/* D-5: Past pools collapsible */}
      {archivedPools.length > 0 && (
        <section>
          <button onClick={() => setPastOpen(!pastOpen)} className="flex items-center gap-1.5 cursor-pointer">
            <span className="font-sans text-[12px] font-medium text-[#A39E96]">
              Past pools ({archivedPools.length})
            </span>
            <svg
              className={`h-3 w-3 text-[#A39E96] transition-transform duration-200 ${pastOpen ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {pastOpen && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {archivedPools.map((p) => <PoolCard key={p.id} pool={p} variant={p.isOrganizer ? "commissioner" : "player"} archived />)}
            </div>
          )}
        </section>
      )}

      {/* If user has no commissioner pools but has player pools, show Create + Join at bottom */}
      {commissionerPools.length === 0 && playerPools.length > 0 && (
        <section>
          <div className="flex items-center gap-3">
            <Link href="/create" className="font-sans text-[12px] font-medium text-[#B09A60] hover:underline">
              + Create a pool
            </Link>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="font-sans text-[12px] font-medium text-[#6B6560] hover:underline cursor-pointer"
            >
              Join a pool
            </button>
          </div>
        </section>
      )}

      {/* Create a Pool form — always visible at bottom */}
      <section>
        <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-3">Create a pool</p>
        <CreatePoolForm />
      </section>
    </div>
  );
}
