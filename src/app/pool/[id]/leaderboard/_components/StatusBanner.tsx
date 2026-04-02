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
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        This pool has been archived.
      </div>
    );
  }

  if (poolStatus === "SETUP") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        Pool is being set up. Check back when picks are open.
      </div>
    );
  }

  if (poolStatus === "OPEN") {
    const deadline = new Date(picksDeadline).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-800">Picks are open until {deadline}</p>
        {!hasEntry && (
          <Link href={`/pool/${poolId}/picks`} className="mt-1 inline-block text-sm font-semibold text-amber-700 underline">
            Submit your picks &rarr;
          </Link>
        )}
      </div>
    );
  }

  if (poolStatus === "LOCKED") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-medium">Picks locked</p>
        <p className="mt-0.5 text-amber-600">Waiting for {tournamentName} to begin.</p>
      </div>
    );
  }

  if (poolStatus === "COMPLETE") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
        Final Results
      </div>
    );
  }

  // LIVE — stale warning
  if (poolStatus === "LIVE" && lastSyncAt) {
    const staleMinutes = Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 60000);
    if (staleMinutes > 15) {
      return (
        <div className={`rounded-lg border px-4 py-2 text-xs ${
          staleMinutes > 30 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
        }`}>
          Scores may be delayed. Last updated {staleMinutes} minutes ago.
        </div>
      );
    }
  }

  return null;
}
