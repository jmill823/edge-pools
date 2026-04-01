export default function PicksLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="h-7 w-48 animate-pulse rounded bg-green-100" />
      <div className="mt-2 h-4 w-36 animate-pulse rounded bg-green-50" />
      <div className="mt-6 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-green-200 p-4">
            <div className="h-5 w-32 animate-pulse rounded bg-green-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
