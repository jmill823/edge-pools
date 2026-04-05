import Link from "next/link";

interface StatusBannerProps {
  poolId: string;
  poolStatus: string;
  picksDeadline: string;
  tournamentName: string;
  lastSyncAt: string | null;
  hasEntry: boolean;
  isArchived?: boolean;
}

export function StatusBanner({
  poolId,
  poolStatus,
  picksDeadline,
  tournamentName,
  lastSyncAt,
  hasEntry,
  isArchived,
}: StatusBannerProps) {
  if (isArchived || poolStatus === "ARCHIVED") {
    return (
      <div className="rounded-card border border-border bg-surface-alt px-4 py-3 font-body text-sm text-text-muted">
        This pool has been archived.
      </div>
    );
  }

  if (poolStatus === "SETUP") {
    return (
      <div className="rounded-card border border-border bg-surface-alt px-4 py-3 font-body text-sm text-text-secondary">
        Pool is being set up. Check back when picks are open.
      </div>
    );
  }

  if (poolStatus === "OPEN") {
    const deadline = new Date(picksDeadline).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    return (
      <div className="rounded-card border border-[#E2DDD5] bg-[#FDF4E3] px-4 py-3">
        <p className="font-body text-sm font-medium text-[#8A6B1E]">Picks are open until {deadline}</p>
        {!hasEntry && (
          <Link href={`/pool/${poolId}/picks`} className="mt-1 inline-block font-body text-sm font-medium text-accent-primary hover:underline cursor-pointer">
            Submit your picks &rarr;
          </Link>
        )}
      </div>
    );
  }

  if (poolStatus === "LOCKED") {
    return (
      <div className="rounded-card border border-[#E2DDD5] bg-[#FDF4E3] px-4 py-3">
        <p className="font-body text-sm font-medium text-[#8A6B1E]">Picks locked</p>
        <p className="mt-0.5 font-body text-text-secondary text-sm">Waiting for {tournamentName} to begin.</p>
      </div>
    );
  }

  if (poolStatus === "COMPLETE") {
    return (
      <div className="rounded-card border border-border bg-[#E8F3ED] px-4 py-3 font-display text-sm font-medium text-accent-primary">
        Final Results
      </div>
    );
  }

  // LIVE — stale warning
  if (poolStatus === "LIVE" && lastSyncAt) {
    const staleMinutes = Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 60000);
    if (staleMinutes > 15) {
      return (
        <div className={`rounded-card border px-4 py-2 font-mono text-xs ${
          staleMinutes > 30 ? "border-accent-danger bg-[#FCEAE9] text-accent-danger" : "border-[#E2DDD5] bg-[#FDF4E3] text-[#8A6B1E]"
        }`}>
          Scores may be delayed. Last updated {staleMinutes} minutes ago.
        </div>
      );
    }
  }

  return null;
}
