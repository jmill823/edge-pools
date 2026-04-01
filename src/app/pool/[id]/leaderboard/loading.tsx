export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="h-6 w-40 animate-pulse rounded bg-green-100" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-green-50" />
      <div className="mt-6 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-8 animate-pulse rounded bg-green-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-green-100" />
            </div>
            <div className="h-4 w-10 animate-pulse rounded bg-green-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
