"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) router.push(`/join/${joinCode.trim()}`);
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-content px-4 py-6 space-y-6 pb-8">
      {/* Title + Join */}
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[18px] font-medium text-[#1A1A18]">Dashboard</h1>
        <button
          onClick={() => setShowJoin(!showJoin)}
          className="rounded-[6px] border border-[#E2DDD5] bg-white text-[#1A1A18] font-sans text-[11px] font-medium px-3 py-2 hover:bg-[#F5F2EB] transition-colors duration-200 cursor-pointer min-h-[44px]"
        >
          Join a pool
        </button>
      </div>

      {showJoin && (
        <form onSubmit={handleJoin} className="flex gap-2">
          <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Invite code" maxLength={8} autoFocus
            className="flex-1 rounded-[6px] border border-[#E2DDD5] bg-white px-3 py-2 font-mono text-sm tracking-widest text-center focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/15 min-h-[44px]" />
          <button type="submit" disabled={!joinCode.trim()}
            className="rounded-[6px] bg-[#2D7A4F] text-white font-sans text-[13px] font-medium px-5 py-2.5 hover:bg-[#246840] transition-colors duration-200 cursor-pointer min-h-[44px] disabled:opacity-40">
            Join
          </button>
        </form>
      )}

      {/* My Pools */}
      {commissionerPools.length > 0 && (
        <section>
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-2">My pools</p>
          <div className="grid grid-cols-2 gap-2">
            {commissionerPools.map((p) => <PoolCard key={p.id} pool={p} variant="commissioner" />)}
          </div>
        </section>
      )}

      {/* Pools I'm In */}
      {playerPools.length > 0 && (
        <section>
          <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-2">Pools I&apos;m in</p>
          <div className="grid grid-cols-2 gap-2">
            {playerPools.map((p) => <PoolCard key={p.id} pool={p} variant="player" />)}
          </div>
        </section>
      )}

      {/* Past Pools */}
      {archivedPools.length > 0 && (
        <section>
          <button onClick={() => setPastOpen(!pastOpen)} className="flex items-center gap-1.5 cursor-pointer w-full">
            <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px]">Past pools</p>
            <svg className={`h-3 w-3 text-[#A39E96] transition-transform duration-200 ${pastOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-sans text-[10px] text-[#A39E96]">({archivedPools.length})</span>
          </button>
          {pastOpen && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {archivedPools.map((p) => <PoolCard key={p.id} pool={p} variant={p.isOrganizer ? "commissioner" : "player"} archived />)}
            </div>
          )}
        </section>
      )}

      {/* Create a Pool — always visible */}
      <section>
        <p className="font-sans text-[12px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-3">Create a pool</p>
        <CreatePoolForm />
      </section>
    </div>
  );
}
