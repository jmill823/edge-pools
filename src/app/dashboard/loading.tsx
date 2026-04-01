export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-green-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-green-200 p-4">
            <div className="h-5 w-32 animate-pulse rounded bg-green-100" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-green-50" />
            <div className="mt-3 flex gap-4">
              <div className="h-3 w-16 animate-pulse rounded bg-green-50" />
              <div className="h-3 w-16 animate-pulse rounded bg-green-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
