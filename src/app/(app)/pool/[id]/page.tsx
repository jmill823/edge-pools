import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function PoolHomePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: { select: { name: true, startDate: true, endDate: true, course: true } },
      organizer: { select: { displayName: true } },
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { golfers: true } } },
      },
      _count: { select: { members: true, entries: true } },
    },
  });

  if (!pool) redirect("/dashboard");

  const members = await prisma.poolMember.findMany({
    where: { poolId: pool.id },
    include: { user: { select: { displayName: true } } },
    orderBy: { joinedAt: "desc" },
    take: 20,
  });

  // Tournament date display
  const startDate = new Date(pool.tournament.startDate);
  const endDate = new Date(pool.tournament.endDate);
  const dateDisplay = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Template name inference from category count
  const catCount = pool.categories.length;
  const formatName = catCount <= 4 ? `Quick ${catCount}-Cat` : catCount <= 6 ? `Quick ${catCount}` : `Classic ${catCount}-Cat`;

  return (
    <div className="mx-auto max-w-content px-4 py-4 space-y-3">
      {/* A. Pool Info Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="font-sans text-[18px] font-medium text-[#1A1A18] truncate">
            {pool.name}
          </h1>
          <StatusBadge status={pool.status} />
        </div>
        <p className="font-sans text-[11px] text-[#A39E96]">
          {pool.tournament.name} · {dateDisplay}
        </p>
        <p className="font-sans text-[10px] text-[#A39E96] mt-0.5">
          Run by {pool.organizer.displayName}
        </p>
      </div>

      {/* B. Pool Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
          <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">MEMBERS</p>
          <p className="font-mono text-[20px] font-bold text-[#1A1A18] leading-tight">{pool._count.members}</p>
        </div>
        <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
          <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">ENTRIES</p>
          <p className="font-mono text-[20px] font-bold text-[#1A1A18] leading-tight">{pool._count.entries}</p>
        </div>
        <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-[10px]">
          <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1">FORMAT</p>
          <p className="font-sans text-[10px] text-[#6B6560] leading-tight mt-1">{formatName}</p>
        </div>
      </div>

      {/* C. Categories Grid */}
      {pool.categories.length > 0 && (
        <div className="border border-[#E2DDD5] rounded-[6px] overflow-hidden">
          <div className="bg-[#B09A60] px-3 py-2">
            <span className="font-sans text-[10px] font-semibold text-white uppercase tracking-[0.5px]">
              CATEGORIES
            </span>
          </div>
          {pool.categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 h-[36px] border-b border-[#E2DDD5] last:border-b-0 bg-white"
            >
              <span className="font-sans text-[12px] text-[#1A1A18] truncate">{cat.name}</span>
              <span className="font-sans text-[10px] text-[#A39E96] shrink-0 ml-2">
                {cat._count.golfers} golfers
              </span>
            </div>
          ))}
        </div>
      )}

      {/* D. Rules Section */}
      {pool.rules && (
        <div className="bg-white border border-[#E2DDD5] rounded-[6px] p-3">
          <p className="font-sans text-[9px] font-medium text-[#A39E96] uppercase tracking-[0.5px] mb-1.5">
            HOUSE RULES
          </p>
          <p className="font-sans text-[11px] text-[#1A1A18] leading-relaxed whitespace-pre-wrap">
            {pool.rules}
          </p>
        </div>
      )}

      {/* E. Members List */}
      <div className="border border-[#E2DDD5] rounded-[6px] overflow-hidden">
        <div className="bg-[#B09A60] px-3 py-2 flex items-center justify-between">
          <span className="font-sans text-[10px] font-semibold text-white uppercase tracking-[0.5px]">
            MEMBERS
          </span>
          <span className="font-sans text-[10px] font-semibold text-white uppercase tracking-[0.5px]">
            JOINED
          </span>
        </div>
        {members.length === 0 ? (
          <div className="px-3 py-6 text-center font-sans text-[11px] text-[#A39E96]">
            No members yet
          </div>
        ) : (
          members.map((m) => {
            const role = m.role === "ORGANIZER" ? "Organizer" : "Player";
            return (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 h-[36px] border-b border-[#E2DDD5] last:border-b-0 bg-white"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-sans text-[12px] text-[#1A1A18] truncate block">{m.user.displayName}</span>
                  <span className="font-sans text-[9px] text-[#A39E96]">{role}</span>
                </div>
                <span className="font-sans text-[10px] text-[#A39E96] shrink-0 ml-2">
                  {relativeTime(m.joinedAt.toISOString())}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
